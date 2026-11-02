-- Non-persistent integration assertions. Every test row is rolled back.
begin;
select set_config('request.jwt.claim.sub',(select owner::text from public.works limit 1),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ declare wid uuid; n integer; begin
  insert into public.works(owner,owner_name,title,category,description,link,details,price,accept_tips)
    values(auth.uid(),'QA rollback only','QA rollback only','tool','Temporary transaction test','https://example.com','{"access":"free","mobile":true}',0,false) returning id into wid;
  perform set_config('aimade.test_work',wid::text,true);
  update public.works set title='QA edited' where id=wid;
  if not exists(select 1 from public.works where id=wid and title='QA edited') then raise exception 'Owner edit failed'; end if;
  insert into public.likes(work_id,user_id) values(wid,auth.uid());
  if (select likes_count from public.work_catalog where id=wid)<>1 then raise exception 'Like count failed'; end if;
  insert into public.reports(work_id,reporter,reason) values(wid,auth.uid(),'Rollback test');
  begin update public.works set details='{"prompt":123}' where id=wid; raise exception 'Invalid details allowed'; exception when check_violation then null; end;
  begin update public.works set created_at=now()+interval '1 year' where id=wid; raise exception 'Timestamp edit allowed'; exception when raise_exception then if sqlerrm='Timestamp edit allowed' then raise; end if; end;
  update public.works set archived=true where id=wid;
  if not exists(select 1 from public.work_catalog where id=wid) then raise exception 'Owner lost archived work'; end if;
end; $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','anon',true);
set local role anon;
do $$ begin
  if exists(select 1 from public.work_catalog where id=current_setting('aimade.test_work')::uuid) then raise exception 'Anonymous saw archived work'; end if;
  if exists(select 1 from public.admins) then raise exception 'Admin identity exposed'; end if;
  if exists(select 1 from public.reports) then raise exception 'Reports exposed'; end if;
  begin insert into public.page_views(path) values('/qa'); raise exception 'Anonymous analytics write allowed'; exception when insufficient_privilege then null; end;
  begin update public.works set title='Unauthorized' where id=current_setting('aimade.test_work')::uuid; raise exception 'Anonymous write allowed'; exception when insufficient_privilege then null; end;
end; $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ declare n integer; begin
  update public.works set title='Unauthorized' where id=current_setting('aimade.test_work')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Other user edited work'; end if;
  if exists(select 1 from public.work_catalog where id=current_setting('aimade.test_work')::uuid) then raise exception 'Other user saw archived work'; end if;
  if exists(select 1 from public.reports) then raise exception 'Other user saw reports'; end if;
  begin insert into public.works(owner,owner_name,title,category) select owner,'X','X','app' from public.works limit 1; raise exception 'Owner spoof allowed'; exception when insufficient_privilege then null; end;
end; $$;
reset role;
rollback;
select 'PASS: owner create/edit/like/report, details validation, immutable timestamp, archive privacy, anonymous write denial, non-owner isolation. All test changes rolled back.' as result;
