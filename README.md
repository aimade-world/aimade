# AIMade

Free discovery and sharing of AI-assisted creations. Live: https://aimade.world/

## Architecture
- GitHub Pages static site: `index.html`, `assets/app.css`, `assets/app.js`.
- Supabase Auth (email magic links), Postgres RLS and public `covers` bucket.
- Supabase JS 2.118.0 is vendored with its MIT license. The pinned package manifest/lockfile supports `npm audit`; the browser uses the vendored UMD file. No secret/service-role key belongs in this repository.
- Client hash routes; `?w=<uuid>` supports copied work links. Social crawlers still see the generic site card, not per-work previews.
- No transactions, tipping, hosted executable code, third-party ad tracking, or AI API proxy.

## Local preview and checks
```
python -m http.server 4173 --bind 127.0.0.1
node --check assets/app.js
node tests/frontend.test.cjs
```
Do not publish from a local preview unless the Auth redirect allowlist is deliberately configured. Preview uses the production read API.

## Database
The November 2 recovery migrations under `supabase/migrations/` have been applied to the existing project. They are **one-time migrations**, not a fresh-install schema or scripts to rerun blindly.

`work_catalog` uses `security_invoker=true`; never change it to a definer view. Owners can edit and reversibly unpublish. Administrators can inspect reports through the Supabase dashboard. Unpublishing is not erasure of public cover objects.

`supabase/tests/20261102_permissions.sql` tests transaction-scoped writes and then rolls them back. It requires one existing owner/work and should be run with administrative DB access. It does not test the actual email inbox or Storage HTTP upload path.

## Operational limits
- Free backend projects can pause when inactive. Check provider alerts; a paid no-pause plan needs the owner's approval.
- Cover limits are 5MB/file, allowed raster formats, owner-folder-only insert, best-effort 20 uploads/day and 50 stored/account. The count policy can race under concurrency and does not stop multi-account abuse.
- Work/report limits are 20 per account per 24h. Reports are administrator-only. Browser page-view writes are retired because the former anonymous endpoint was unlimited.
- Add CAPTCHA and monitor usage before a large public promotion. Do not create artificial traffic as a substitute for reliable hosting.
- Keep regular private DB/Auth/storage backups and test restores. Application JSON exports are not full backups. Never upload those exports here.
- Review provider MFA, DNS/domain renewal, dependency updates, reports and orphaned images periodically.

## Rollback
Frontend rollback can use Git revert to restore the prior commit; the additive columns do not require deleting data. The old frontend's page-view writes are no longer permitted. Do not undo security policies, drop columns or overwrite user data just to roll back the visual design.
