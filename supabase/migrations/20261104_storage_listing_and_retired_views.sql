-- Tighten existing policies only. No rows, objects, users or roles are deleted.
-- Public cover URLs remain readable because the covers bucket stays public.
-- Apply once, after inspecting/backing up the current policy definitions.
begin;
alter policy "anon insert views" on public.page_views with check (false);
alter policy "public read covers" on storage.objects to authenticated
  using (
    bucket_id = 'covers' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
    )
  );
commit;
