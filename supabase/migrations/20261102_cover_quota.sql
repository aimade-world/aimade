-- A best-effort per-account ceiling, not a global anti-bot solution.
-- Storage handles metadata timestamps. Concurrent requests can race this policy;
-- CAPTCHA, provider quotas and monitoring remain necessary at larger scale.
begin;
create policy "covers per account quota v2" on storage.objects as restrictive for insert to authenticated with check (
  bucket_id <> 'covers' or (
    (select count(*) from storage.objects o where o.bucket_id='covers' and (storage.foldername(o.name))[1]=auth.uid()::text) < 50
    and (select count(*) from storage.objects o where o.bucket_id='covers' and (storage.foldername(o.name))[1]=auth.uid()::text and o.created_at>now()-interval '24 hours') < 20
  )
);
commit;
