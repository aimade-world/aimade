# AIMade

Free discovery and sharing of AI-assisted creations. Live: https://aimade.world/

## Architecture
- GitHub Pages static site: `index.html`, `assets/app.css`, `assets/app.js`, `assets/captcha.js`.
- Supabase Auth (email/password, one-time email verification and password recovery), Postgres RLS and public `covers` bucket.
- Supabase JS 2.118.0 is vendored with its MIT license. The pinned package manifest/lockfile supports `npm audit`; the browser uses the vendored UMD file. No secret/service-role key belongs in this repository.
- Client hash routes; `?w=<uuid>` supports copied work links. Social crawlers still see the generic site card, not per-work previews.
- No transactions, tipping, hosted executable code, third-party ad tracking, or AI API proxy.

## Local preview and checks
```
python -m http.server 4173 --bind 127.0.0.1
node --check assets/app.js
npm test
```
Preview uses the production read API. Auth writes are blocked unless the page origin is exactly `https://aimade.world`; never add localhost to the production Auth allowlist just to test this UI.

## Drafts and sign-in flow
- Current product decision: email/password only. No Google, Apple or X buttons, OAuth credentials, public personal Gmail, or hidden third-party login placeholders.
- `aimade_drafts_v4:<account UUID>` separates each account's new-creation and per-work edit drafts. Guests use a separate scope. Old v2/v3 data is retained; an ownerless legacy creation draft is not assigned to the next signed-in account. A legacy edit may be imported only after its owner is verified. Account switches hide the previous account's draft without deleting it. These browser-local drafts are neither encrypted nor synced; clear site data on shared devices.
- Entering Share opens the new-creation draft, not the last edited published work. A notice links to the last saved edit. Edit data is loaded only after the authenticated owner is verified, and stale edit responses cannot replace a newer route.
- Signup responses never claim an account was created or a verification email was delivered: a previously confirmed account can return an obfuscated response. Sign-in, signup and the signup response all link clearly to password setup for legacy email-link users. No public email-existence lookup was added.
- `PASSWORD_RECOVERY` broadcasts update other tabs to signed-in without opening another reset form. Only the actual recovery callback tab may open that form; completing or cancelling clears the callback marker.
- Email/password is the primary sign-in flow, not magic links. First registration requires email verification. Existing email-link users set a password once via Forgot / set password; this updates the existing Auth user, not a newly created account. Never recreate or auto-promote the administrator by email.
- Registration and recovery require matching passwords with at least 12 characters. Passwords are never copied to drafts, logs or local storage, and fields are cleared on completion, mode switch and modal close. Existing shorter passwords are not rejected by the sign-in form.
- Recovery returns to `https://aimade.world/?auth=recovery` (a real static root page, not a GitHub Pages 404). It verifies the current user with Auth before enabling `updateUser`, handles `PASSWORD_RECOVERY`, removes token fragments from the visible URL, and preserves the safe draft return route.
- Supabase Site URL is `https://aimade.world/`. The redirect allowlist contains that exact URL and the exact HTTPS recovery URL. The obsolete HTTP wildcard was removed. Email confirmation remains ON; minimum password length is 12 and secure password change is ON. Leaked-password screening is not enabled on the current free plan.
- Signup confirmation and password setup mail have a confirmation panel, a client-side resend delay and a distinct rate-limit message. Backend rate limits are still required; the client delay is not an abuse-prevention boundary. Only allowlisted local hash routes can resume after login.
- Ordinary sign-out explicitly uses the local scope, so it does not unexpectedly sign the user out on every other device.
- Legal consent is never restored from a draft. Required trimmed text is checked before a file upload. Publishing locks the form, retains the pending creation ID and reuses completed/in-flight cover uploads on retry.
- The automated flow tests use stubbed Auth, Storage and database clients. They do not prove real email delivery or a complete production publication. Those require an owner-assisted end-to-end test.
- November 10 prelaunch UI: expired email callbacks without a recovery marker now open the password-email request form with a clear explanation, never an unverified new-password form. Callback/provider details remain hidden. Auth status appears before the verification widget. Main buttons, category controls and action links have at least 44px height on small screens/touch devices.

## CAPTCHA
- Cloudflare Turnstile is enabled in Supabase Auth as well as the frontend. The public sitekey belongs in the HTML; the secret belongs only in the provider's server configuration, never Git, frontend files, logs or screenshots.
- Sign-in, signup, recovery email and verification-email resend each require a fresh single-use token. The widget loads on opening the auth dialog; stale tokens, missing modules and widget errors fail closed with a retry path. Tokens stay in page memory only.
- The authenticated password-recovery callback does not require an extra CAPTCHA. Do not disable email verification or alter existing accounts to work around CAPTCHA failures.
- On 2026-11-04, eight live missing/invalid-token probes were rejected with `captcha_failed`, and the owner completed a real human-verification/password-login round trip. The ordinary account's saved draft returned after sign-in. Automated checks total 98; they are not a penetration test or a guarantee against all bots.
- Recheck the live domain allowlist and server secret after any widget change. Production auth writes stay limited to the exact production origin; do not weaken that guard for local preview.
- The widget uses the official compact layout when its container is narrower than 300px; flexible layout otherwise. Crossing that boundary while idle remounts the widget and invalidates the old token. No sitekey, server secret, challenge requirement or token lifetime was changed. Current offline suite: 106 checks (15 frontend plus 91 flow/CAPTCHA tests).

## Database
The November 2 recovery migrations under `supabase/migrations/` have been applied to the existing project. They are **one-time migrations**, not a fresh-install schema or scripts to rerun blindly.

`20261104_storage_listing_and_retired_views.sql` was also applied. The retired browser page-view insert policy now denies writes in addition to the revoked INSERT grants. Cover listing is restricted to each authenticated owner's folder or an existing administrator. The bucket stays public so published image URLs still load. Known public URLs can still be downloaded: this is not DRM or complete erasure after unpublishing. A transaction checked anonymous/ordinary/admin listing and unchanged work/storage data before commit.

On November 10, a separately approved production repair replaced the recursive INSERT quota subquery with `aimade_internal.own_cover_quota_ok()`: zero arguments, current `auth.uid()` only, boolean result, fixed empty search path, controlled postgres SECURITY DEFINER, no anon EXECUTE. `aimade_internal` is not an exposed Data API schema. Existing ownership checks, cover limits, public bucket and all original work/admin rows were preserved. The guarded applied SQL and before/after evidence are retained in the owner's private project outputs, not automatically rerun by a frontend deploy. Postgres future default grants were narrowed; managed `supabase_admin` defaults and dashboard auto-exposure settings were not changed. Review grants/RLS whenever creating a new table or function, including through the dashboard. The old one-time quota migration alone does not represent this repaired state.

`work_catalog` uses `security_invoker=true`; never change it to a definer view. Owners can edit and reversibly unpublish. Administrators can inspect reports through the Supabase dashboard. Unpublishing is not erasure of public cover objects.

`supabase/tests/20261102_permissions.sql` tests transaction-scoped writes and then rolls them back. It requires one existing owner/work and should be run with administrative DB access. It does not test the actual email inbox or Storage HTTP upload path.

## Operational limits
- Free backend projects can pause when inactive. Check provider alerts; a paid no-pause plan needs the owner's approval.
- Cover limits are 5MB/file, allowed raster formats, owner-folder-only insert, best-effort 20 uploads/day and 50 stored/account. The count policy can race under concurrency and does not stop multi-account abuse.
- Work/report limits are 20 per account per 24h. Reports are administrator-only. Browser page-view writes are retired because the former anonymous endpoint was unlimited.
- CAPTCHA is enabled; continue monitoring usage before and during promotion. It reduces abuse but does not replace rate limits, quotas or moderation. Do not create artificial traffic as a substitute for reliable hosting.
- Keep regular private DB/Auth/storage backups and test restores. Application JSON exports are not full backups. Never upload those exports here.
- Review provider MFA, DNS/domain renewal, dependency updates, reports and orphaned images periodically.

## Rollback
Frontend rollback can use Git revert to restore the prior commit; the additive columns do not require deleting data. The old frontend's page-view writes are no longer permitted. Do not undo security policies, drop columns or overwrite user data just to roll back the visual design.
