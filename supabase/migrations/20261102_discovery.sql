-- Additive recovery upgrade. Back up application data before applying.
begin;
alter table public.works add column if not exists details jsonb not null default '{}';
alter table public.works add column if not exists archived boolean not null default false;
alter table public.works add constraint works_details_v2 check (
  jsonb_typeof(details) = 'object' and octet_length(details::text) <= 40000
  and (details - array['access','mobile','feedback','tools','prompt']::text[]) = '{}'
  and (not details ? 'access' or (jsonb_typeof(details->'access')='string' and details->>'access' in ('unknown','free','login','trial','display')))
  and (not details ? 'mobile' or jsonb_typeof(details->'mobile')='boolean')
  and (not details ? 'feedback' or jsonb_typeof(details->'feedback')='boolean')
  and (not details ? 'tools' or (jsonb_typeof(details->'tools')='string' and char_length(details->>'tools')<=160))
  and (not details ? 'prompt' or (jsonb_typeof(details->'prompt')='string' and char_length(details->>'prompt')<=6000))
);
alter table public.works add constraint works_extra_lengths_v2 check (char_length(btrim(title))>0 and char_length(btrim(owner_name)) between 1 and 40 and char_length(link)<=2000 and char_length(cover_url)<=2000);
alter table public.reports add constraint reports_reason_length_v2 check (char_length(reason)<=1000);
alter policy "owner update works" on public.works using (auth.uid()=owner) with check (auth.uid()=owner);
alter policy "public read works" on public.works using (not archived or auth.uid()=owner or exists(select 1 from public.admins a where a.user_id=auth.uid()));
-- Do not expose archived works to readers through a definer view.
create or replace view public.work_catalog with (security_invoker=true) as select w.*, (select count(*)::integer from public.likes l where l.work_id=w.id) as likes_count from public.works w;
revoke all on public.work_catalog from anon, authenticated;
grant select on public.work_catalog to anon, authenticated;
-- Restrict unused table-level operations as well as row-level permissions.
revoke insert,update,delete,truncate,references,trigger on public.works,public.likes,public.reports,public.admins,public.page_views from anon;
revoke truncate,references,trigger on public.works,public.likes,public.reports,public.admins,public.page_views from authenticated;
revoke insert,update,delete on public.admins from authenticated;
revoke update,delete on public.reports from authenticated;
-- Retire direct browser analytics writes: unlimited anonymous writes are abusable.
revoke insert,update,delete on public.page_views from authenticated;
create index if not exists works_owner_created_v2 on public.works(owner,created_at desc);
create index if not exists works_category_created_v2 on public.works(category,created_at desc);
create or replace function public.guard_work_identity_v2() returns trigger language plpgsql set search_path='' as $$ begin if tg_op='INSERT' then new.created_at=now(); elsif new.id is distinct from old.id or new.owner is distinct from old.owner or new.created_at is distinct from old.created_at then raise exception 'Work identity and creation time are immutable'; end if; return new; end; $$;
create trigger a_guard_work_identity_v2 before insert or update on public.works for each row execute function public.guard_work_identity_v2();
create or replace function public.check_daily_upload_limit() returns trigger language plpgsql security definer set search_path='' as $$ begin perform pg_advisory_xact_lock(hashtextextended(new.owner::text,0)); if (select count(*) from public.works where owner=new.owner and created_at>now()-interval '24 hours')>=20 then raise exception 'Daily upload limit reached'; end if; return new; end; $$;
create or replace function public.limit_reports_v2() returns trigger language plpgsql security definer set search_path='' as $$ begin perform pg_advisory_xact_lock(hashtextextended(new.reporter::text,1)); new.created_at=now(); if (select count(*) from public.reports where reporter=new.reporter and created_at>now()-interval '24 hours')>=20 then raise exception 'Daily report limit reached'; end if; return new; end; $$;
create trigger limit_reports_v2 before insert on public.reports for each row execute function public.limit_reports_v2();
revoke execute on function public.guard_work_identity_v2(), public.check_daily_upload_limit(), public.limit_reports_v2() from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;
