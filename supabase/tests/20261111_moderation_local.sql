-- Synthetic integration test. Requires fixtures/20261111_moderation_local.sql in a LOCAL db.
-- Explicit database-name guard; do not change it to run in production.
begin;
do $$begin if current_database()<>'aimade_moderation_qa' then raise exception 'Local synthetic test only'; end if; end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare v text; n integer; begin
  foreach v in array array['a','中','12','１２','١٢','!!!','  中  ','　'] loop
    begin
      insert into works(owner,title,category,description) values(auth.uid(),v,'prompt',repeat('用途',20));
      raise exception 'Invalid title accepted: %',v;
    exception when check_violation then null; end;
  end loop;
  foreach v in array array['中文','AI','遊戲2','１２遊戲','テスト','테스트','αβ'] loop
    insert into works(owner,title,category,description) values(auth.uid(),v,'prompt',repeat('用途',20));
  end loop;
  begin insert into works(owner,title,category,description) values(auth.uid(),'短文','prompt',repeat('中',29));raise exception 'Short description accepted';exception when check_violation then null;end;
  begin insert into works(owner,title,category,description) values(auth.uid(),'短文','prompt','中'||repeat(' ',60));raise exception 'Whitespace inflated count';exception when check_violation then null;end;
  insert into works(id,owner,title,category,description) values('00000000-0000-4000-8000-000000000011',auth.uid(),'邊界','prompt',repeat('中',30));
  begin update works set title='123' where id='00000000-0000-4000-8000-000000000011';raise exception 'Numeric edit accepted';exception when check_violation then null;end;
  begin update works set description='短' where id='00000000-0000-4000-8000-000000000011';raise exception 'Short edit accepted';exception when check_violation then null;end;
  begin update works set archived=true,moderation_status='hidden' where id='00000000-0000-4000-8000-000000000011';raise exception 'Owner self-moderation accepted';exception when insufficient_privilege then null;end;
  -- Unchanged short legacy data can still be unpublished/restored, not rewritten.
  update works set archived=false where id='00000000-0000-4000-8000-000000000010';
  update works set archived=true where id='00000000-0000-4000-8000-000000000010';
end$$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$begin
  update works set archived=true,moderation_status='hidden' where id='00000000-0000-4000-8000-000000000011';
  if not exists(select 1 from work_catalog where id='00000000-0000-4000-8000-000000000011' and moderated_at is not null and owner='00000000-0000-4000-8000-000000000002') then raise exception 'Admin moderation failed / owner changed';end if;
  begin update works set owner=auth.uid() where id='00000000-0000-4000-8000-000000000011';raise exception 'Owner mutation allowed';exception when raise_exception then if sqlerrm='Owner mutation allowed' then raise;end if;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$begin
  begin update works set archived=false where id='00000000-0000-4000-8000-000000000011';raise exception 'Author bypassed moderator';exception when insufficient_privilege then null;end;
  begin update works set archived=false,moderation_status='clear' where id='00000000-0000-4000-8000-000000000011';raise exception 'Author cleared moderation';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$declare n integer;begin
  update works set archived=false,moderation_status='clear' where id='00000000-0000-4000-8000-000000000011';get diagnostics n=row_count;
  if n<>0 or exists(select 1 from work_catalog where id='00000000-0000-4000-8000-000000000011') then raise exception 'Cross-account isolation failed';end if;
  if exists(select 1 from admins) then raise exception 'Admin membership exposed';end if;
end$$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$begin
  if exists(select 1 from work_catalog where id='00000000-0000-4000-8000-000000000011') then raise exception 'Anonymous sees moderated data';end if;
  if has_function_privilege('anon','aimade_internal.guard_work_moderation_quality()','execute') then raise exception 'Trigger exposed';end if;
end$$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$declare n integer;begin
  update works set archived=false,moderation_status='clear' where id='00000000-0000-4000-8000-000000000011';
  if not exists(select 1 from works where id='00000000-0000-4000-8000-000000000011' and not archived) then raise exception 'Republish failed';end if;
  update works set archived=true,moderation_status='trash' where id='00000000-0000-4000-8000-000000000011';
  update works set moderation_status='hidden' where id='00000000-0000-4000-8000-000000000011';
  if not exists(select 1 from works where id='00000000-0000-4000-8000-000000000011' and archived) then raise exception 'Recover must stay unpublished';end if;
  update works set moderation_status='trash' where id='00000000-0000-4000-8000-000000000011';
  delete from works where id='00000000-0000-4000-8000-000000000011' and moderation_status='trash';get diagnostics n=row_count;
  if n<>1 then raise exception 'Admin delete failed';end if;
end$$;
reset role;
rollback;
select 'PASS: local Unicode/length checks, owner isolation, moderator lock, republish, trash, recovery, delete; synthetic changes rolled back' as result;
