-- New isolated APK workflow; never change covers or an existing work/account.
begin;
set local lock_timeout='3s';
set local statement_timeout='20s';
create table public.apk_uploads (
 id uuid primary key default gen_random_uuid(), work_id uuid not null references public.works(id) on delete restrict,
 owner uuid not null, object_path text not null unique, filename text not null check(char_length(filename) between 5 and 100),
 size_bytes bigint not null check(size_bytes between 4 and 26214400), sha256 text not null check(sha256~'^[0-9a-f]{64}$'),
 status text not null default 'uploading' check(status in ('uploading','pending','approved','rejected','withdrawn')),
 created_at timestamptz not null default now(), reviewed_at timestamptz, review_note text not null default '' check(char_length(review_note)<=500)
);
create index apk_work_created on public.apk_uploads(work_id,created_at desc);
create index apk_owner_created on public.apk_uploads(owner,created_at desc);
alter table public.apk_uploads enable row level security;
revoke all on public.apk_uploads from public,anon,authenticated;
grant select on public.apk_uploads to authenticated;
grant all on public.apk_uploads to service_role;
create policy apk_metadata_read on public.apk_uploads for select to authenticated using (
 owner=auth.uid() or exists(select 1 from public.admins a where a.user_id=auth.uid())
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('apk-quarantine','apk-quarantine',false,26214400,array['application/vnd.android.package-archive']);

-- The global lock makes reserved capacity a hard bound, including concurrent uploads.
create function public.reserve_apk_upload(p_work uuid,p_size bigint,p_filename text,p_sha256 text)
returns public.apk_uploads language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); item public.apk_uploads; new_id uuid:=gen_random_uuid();
begin
 if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then raise exception 'Verified account required';end if;
 if p_size is null or p_size not between 4 and 26214400 or p_filename is null or char_length(p_filename) not between 5 and 100 or p_filename!~*'^[^/\\[:cntrl:]]+[.]apk$' or p_sha256 is null or p_sha256!~'^[0-9a-f]{64}$' then raise exception 'Invalid APK metadata';end if;
 perform pg_advisory_xact_lock(91871120261111);
 if not exists(select 1 from public.works where id=p_work and owner=actor and moderation_status='clear') then raise exception 'Only the author can upload to an available work';end if;
 select * into item from public.apk_uploads where work_id=p_work and owner=actor and sha256=p_sha256 and size_bytes=p_size and status in ('uploading','pending') and created_at>now()-interval '30 minutes' order by created_at desc limit 1;
 if found then return item;end if; -- a retry must not consume another reservation
 if (select count(*) from public.apk_uploads where owner=actor and created_at>now()-interval '24 hours')>=2 then raise exception 'apk_daily_limit';end if;
 if (select count(*) from public.apk_uploads where owner=actor)>=3 then raise exception 'apk_account_limit';end if;
 -- Charge the full bucket maximum for every slot, even if the client lies about size
 -- or an upload succeeds but finalization fails. Eight immutable slots = at most 200 MiB.
 if (select count(*) from public.apk_uploads)>=8 then raise exception 'apk_capacity_limit';end if;
 insert into public.apk_uploads(id,work_id,owner,object_path,filename,size_bytes,sha256)
 values(new_id,p_work,actor,actor::text||'/'||new_id::text||'.apk',p_filename,p_size,p_sha256) returning * into item;
 return item;
end $$;
create function public.finish_apk_upload(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare item public.apk_uploads; actual bigint;
begin
 select * into item from public.apk_uploads where id=p_id and owner=auth.uid() for update;
 if not found or item.status not in ('uploading','pending') then raise exception 'Upload not available';end if;
 select (metadata->>'size')::bigint into actual from storage.objects where bucket_id='apk-quarantine' and name=item.object_path;
 if actual is distinct from item.size_bytes then raise exception 'Uploaded size mismatch';end if;
 update public.apk_uploads set status='pending' where id=p_id;
end $$;
create function public.review_apk_upload(p_id uuid,p_approve boolean,p_note text,p_sha256 text)
returns void language plpgsql security definer set search_path='' as $$
declare item public.apk_uploads;
begin
 if not exists(select 1 from public.admins where user_id=auth.uid()) then raise exception 'Administrator required';end if;
 select * into item from public.apk_uploads where id=p_id for update;
 if not found or item.status not in ('pending','approved') or p_approve is null then raise exception 'Review unavailable';end if;
 if p_note is null or char_length(btrim(p_note)) not between 20 and 500 then raise exception 'A review record of 20–500 characters is required';end if;
 if p_approve then
   if p_sha256 is distinct from item.sha256 then raise exception 'Verified hash mismatch';end if;
   if not exists(select 1 from storage.objects where bucket_id='apk-quarantine' and name=item.object_path and (metadata->>'size')::bigint=item.size_bytes) then raise exception 'File not available';end if;
   if not exists(select 1 from public.works where id=item.work_id and not archived and moderation_status='clear') then raise exception 'Work not public';end if;
   update public.apk_uploads set status='withdrawn' where work_id=item.work_id and status='approved' and id<>p_id;
 end if;
 update public.apk_uploads set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now(),review_note=btrim(p_note) where id=p_id;
end $$;
create function public.withdraw_apk_upload(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.apk_uploads set status='withdrawn' where id=p_id and owner=auth.uid();
 if not found then raise exception 'Author required';end if;
end $$;
-- Public metadata deliberately omits author IDs, paths and private review notes.
create function public.public_apk_for_work(p_work uuid)
returns table(id uuid,filename text,size_bytes bigint,sha256 text,reviewed_at timestamptz)
language sql stable security definer set search_path='' as $$
 select p.id,p.filename,p.size_bytes,p.sha256,p.reviewed_at from public.apk_uploads p join public.works w on w.id=p.work_id
 where p.work_id=p_work and p.status='approved' and not w.archived and w.moderation_status='clear' order by p.reviewed_at desc limit 1
$$;
revoke all on function public.reserve_apk_upload(uuid,bigint,text,text),public.finish_apk_upload(uuid),public.review_apk_upload(uuid,boolean,text,text),public.withdraw_apk_upload(uuid),public.public_apk_for_work(uuid) from public,anon,authenticated;
grant execute on function public.reserve_apk_upload(uuid,bigint,text,text),public.finish_apk_upload(uuid),public.review_apk_upload(uuid,boolean,text,text),public.withdraw_apk_upload(uuid) to authenticated;
grant execute on function public.public_apk_for_work(uuid) to anon,authenticated;
-- Public file transfers have a hard application budget: 100 MiB/day, 1 GiB/month.
-- Reserve bytes before streaming; failures count conservatively. No IP/user tracking.
create table aimade_internal.apk_download_budget(period text primary key,bytes bigint not null);
alter table aimade_internal.apk_download_budget enable row level security;
revoke all on aimade_internal.apk_download_budget from public,anon,authenticated;
create function public.claim_apk_download(p_id uuid)
returns table(object_path text,size_bytes bigint) language plpgsql security definer set search_path='' as $$
declare item public.apk_uploads; day_key text:='d:'||to_char(now() at time zone 'UTC','YYYY-MM-DD'); month_key text:='m:'||to_char(now() at time zone 'UTC','YYYY-MM');
begin
 perform pg_advisory_xact_lock(91871120261112);
 select p.* into item from public.apk_uploads p join public.works w on w.id=p.work_id where p.id=p_id and p.status='approved' and not w.archived and w.moderation_status='clear';
 if not found then return;end if;
 if coalesce((select b.bytes from aimade_internal.apk_download_budget b where b.period=day_key),0)+item.size_bytes>104857600 or coalesce((select b.bytes from aimade_internal.apk_download_budget b where b.period=month_key),0)+item.size_bytes>1073741824 then raise exception 'apk_download_budget';end if;
 insert into aimade_internal.apk_download_budget as b(period,bytes) values(day_key,item.size_bytes),(month_key,item.size_bytes) on conflict(period) do update set bytes=b.bytes+excluded.bytes;
 return query select item.object_path,item.size_bytes;
end $$;
revoke all on function public.claim_apk_download(uuid) from public,anon,authenticated;
grant execute on function public.claim_apk_download(uuid) to service_role;
-- No SELECT grant to anonymous/users on the objects: they cannot mint signed URLs.
-- Only existing administrators can download quarantine files for manual review.
create policy apk_reserved_insert on storage.objects for insert to authenticated with check (
 bucket_id='apk-quarantine' and exists(select 1 from public.apk_uploads p where p.object_path=name and p.owner=auth.uid() and p.status='uploading' and p.created_at>now()-interval '30 minutes')
);
create policy apk_admin_review_read on storage.objects for select to authenticated using (
 bucket_id='apk-quarantine' and exists(select 1 from public.admins where user_id=auth.uid())
);
-- Defense in depth against another bucket's permissive policy being broadened later.
create policy apk_insert_boundary on storage.objects as restrictive for insert to public with check (
 bucket_id<>'apk-quarantine' or exists(select 1 from public.apk_uploads p where p.object_path=name and p.owner=auth.uid() and p.status='uploading' and p.created_at>now()-interval '30 minutes')
);
create policy apk_read_boundary on storage.objects as restrictive for select to public using (
 bucket_id<>'apk-quarantine' or exists(select 1 from public.admins where user_id=auth.uid())
);
create policy apk_no_replace on storage.objects as restrictive for update to public using(bucket_id<>'apk-quarantine') with check(bucket_id<>'apk-quarantine');
create policy apk_no_delete on storage.objects as restrictive for delete to public using(bucket_id<>'apk-quarantine');
-- No UPDATE / DELETE policy, so neither replacement-after-review nor quota-reset is possible.
notify pgrst,'reload schema';
commit;
