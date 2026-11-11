-- Additive moderation controls. No existing work, account or cover is rewritten.
begin;
set local lock_timeout='3s';
set local statement_timeout='20s';
alter table public.works add column moderation_status text not null default 'clear';
alter table public.works add column moderated_at timestamptz;
alter table public.works add constraint works_moderation_state_v1 check (
  moderation_status in ('clear','hidden','trash') and (moderation_status='clear' or archived)
);

-- Invoker trigger: admins are checked against the existing RLS-protected membership.
-- No SECURITY DEFINER, extra API, new admin membership, or arbitrary-user argument.
create function aimade_internal.guard_work_moderation_quality()
returns trigger language plpgsql set search_path='' as $body$
declare administrator boolean; compact_title text; compact_description text;
begin
  if tg_op='INSERT' or new.title is distinct from old.title then
    compact_title:=regexp_replace(coalesce(new.title,'') collate pg_catalog."und-x-icu",'[[:space:]' || chr(160) || chr(8203) || chr(65279) || ']','','g');
    if char_length(compact_title)<2 or char_length(new.title)>120 or compact_title collate pg_catalog."und-x-icu" !~ '[[:alpha:]]' then
      raise exception using errcode='23514',message='aimade_title_quality';
    end if;
  end if;
  if tg_op='INSERT' or new.description is distinct from old.description then
    compact_description:=regexp_replace(coalesce(new.description,'') collate pg_catalog."und-x-icu",'[[:space:]' || chr(160) || chr(8203) || chr(65279) || ']','','g');
    if char_length(compact_description)<30 or char_length(new.description)>2000 then
      raise exception using errcode='23514',message='aimade_description_quality';
    end if;
  end if;
  if tg_op='INSERT' then
    if new.moderation_status<>'clear' or new.moderated_at is not null then
      raise exception using errcode='42501',message='Moderation fields are server controlled';
    end if;
  else
    if new.moderation_status is distinct from old.moderation_status or
       (old.moderation_status<>'clear' and new.archived is distinct from old.archived) then
      select exists(select 1 from public.admins where user_id=auth.uid()) into administrator;
      if not administrator then
        raise exception using errcode='42501',message='Administrator moderation cannot be changed by the author';
      end if;
      new.moderated_at:=pg_catalog.clock_timestamp();
    else
      new.moderated_at:=old.moderated_at;
    end if;
  end if;
  return new;
end $body$;
revoke all on function aimade_internal.guard_work_moderation_quality() from public,anon,authenticated;
create trigger b_guard_work_moderation_quality before insert or update on public.works
for each row execute function aimade_internal.guard_work_moderation_quality();

-- Append the two columns without changing existing view column order or security.
create or replace view public.work_catalog with (security_invoker=true) as
select w.id,w.created_at,w.owner,w.owner_name,w.title,w.category,w.description,w.link,
       w.cover_url,w.price,w.accept_tips,w.details,w.archived,
       (select count(*)::integer from public.likes l where l.work_id=w.id) as likes_count,
       w.moderation_status,w.moderated_at
from public.works w;
revoke all on public.work_catalog from anon,authenticated;
grant select on public.work_catalog to anon,authenticated;
notify pgrst,'reload schema';
commit;
