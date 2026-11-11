-- Add only new metadata keys. Existing rows, ownership and visibility are unchanged.
begin;
set local lock_timeout='3s';
set local statement_timeout='20s';
alter table public.works drop constraint works_details_v2;
alter table public.works add constraint works_details_v3 check (
  jsonb_typeof(details)='object' and octet_length(details::text)<=40000
  and (details-array['access','mobile','feedback','tools','prompt','platforms','beta','appStore','googlePlay','testFlight']::text[])='{}'
  and (not details?'access' or (jsonb_typeof(details->'access')='string' and details->>'access' in ('unknown','free','login','trial','display')))
  and (not details?'mobile' or jsonb_typeof(details->'mobile')='boolean')
  and (not details?'feedback' or jsonb_typeof(details->'feedback')='boolean')
  and (not details?'tools' or (jsonb_typeof(details->'tools')='string' and char_length(details->>'tools')<=160))
  and (not details?'prompt' or (jsonb_typeof(details->'prompt')='string' and char_length(details->>'prompt')<=6000))
  and (not details?'platforms' or (jsonb_typeof(details->'platforms')='array' and details->'platforms'<@'["web","ios","android"]'::jsonb and jsonb_array_length(details->'platforms')<=3))
  and (not details?'beta' or jsonb_typeof(details->'beta')='boolean')
  and (not details?'appStore' or (jsonb_typeof(details->'appStore')='string' and char_length(details->>'appStore')<=2000 and (details->>'appStore'='' or details->>'appStore'~'^https://apps[.]apple[.]com/([a-z]{2}/)?app/([^/?#]+/)?id[0-9]+/?([?#].*)?$')))
  and (not details?'googlePlay' or (jsonb_typeof(details->'googlePlay')='string' and char_length(details->>'googlePlay')<=2000 and (details->>'googlePlay'='' or details->>'googlePlay'~'^https://play[.]google[.]com/store/apps/details[?]([^#]*&)?id=[A-Za-z][A-Za-z0-9_]*([.][A-Za-z][A-Za-z0-9_]*)+([&#].*)?$')))
  and (not details?'testFlight' or (jsonb_typeof(details->'testFlight')='string' and char_length(details->>'testFlight')<=2000 and (details->>'testFlight'='' or details->>'testFlight'~'^https://testflight[.]apple[.]com/join/[A-Za-z0-9]{6,32}/?([?#].*)?$')))
);
notify pgrst,'reload schema';
commit;
