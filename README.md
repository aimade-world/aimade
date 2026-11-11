# AIMade

Free discovery and sharing of AI-assisted creations. Live: https://aimade.world/

## Architecture
- GitHub Pages static site: `index.html`, `assets/app.css`, `assets/app.js`, `assets/captcha.js`.
- Supabase Auth (email/password, one-time email verification and password recovery), Postgres RLS and public `covers` bucket.
- Supabase JS 2.118.0 is vendored with its MIT license. The pinned package manifest/lockfile supports `npm audit`; the browser uses the vendored UMD file. No secret/service-role key belongs in this repository.
- Client hash routes; `?w=<uuid>` supports copied work links. Social crawlers still see the generic site card, not per-work previews.
- No transactions, tipping, hosted executable code, third-party ad tracking, or AI API proxy.

## Interface
- November 10 redesign: white ground, one action colour, and one tint per work type. Fonts are Noto Sans TC (400/700/900) plus Space Grotesk 700; the former four families are gone. Icons are inline SVG, so the CSP is unchanged.
- A work without a cover, or whose image fails to load, shows its type tint and icon instead of a shared placeholder.
- The work page puts the main action (open the link, or copy the Prompt) beside the title. At 620px and below it is pinned to the bottom, and `route()` sets `data-mode` on `<html>` so the stylesheet can hide the tab bar there.
- On phones `#nav` is a fixed bottom tab bar; the hamburger menu and its script were removed. Works render as compact rows.
- Less common work types sit behind the "更多分類" chip until opened or active.
- "你可能也想看" on the work page reads up to three other public works from `work_catalog` (same type first). It is optional and fails silently.
- Narrow-phone follow-up: at 360px and below the card actions use a full-width row; action rows can wrap instead of overflowing or shrinking the 44px touch targets. The cover, colours, typography and wider layouts keep the redesign.
- Related queries select only `id,title,category,owner_name,cover_url`, exclude the current work on the server and request at most three rows. The existing most-liked/newest/id ranking and same-type-first fallback are unchanged. A bounded 24-entry, per-account memory cache lasts 30 seconds, including empty results; failures are not cached. Navigation/account changes cancel optional requests, one 15-second budget covers both queries, and own successful publication/edit/unpublication clears the cache. Other users' changes may take up to that cache TTL to appear on a revisit. No persisted cache, schema change or new API permission was added. Computed like-count sorting can still become expensive at scale; measure it before adding indexes/materialized counts.
- November 11 weekly picks: the home page opens with one story card and themed shelves above the full list. They come from `assets/featured.js`, which the owner edits by hand and publishes; no database change. A pick that is missing or no longer public falls back to the most liked recent work, and the block hides while a search, type or sort is active.
- `featured.js` is a same-origin script, not fetched JSON, because the CSP `connect-src` allows only the backend. Its texts are escaped like any other content. The picks read up to 40 recent public works, plus at most one configured-pick lookup. Each unfiltered home refresh revalidates them instead of keeping a session-long snapshot. Both queries and rendering require archived=false and moderation_status=clear. Navigation, account changes and successful work/moderation writes clear the old DOM and abort pending recommendations; one 15-second budget covers the whole fetch. A failed refresh leaves the optional block hidden rather than showing stale cards. There is no real-time subscription: already-open pages on other devices refresh when revisited/reloaded.
- From 901px the header is a sidebar that also lists the work types; the chips row is hidden there. Below that the layout is unchanged (top bar, and the bottom tab bar on phones).
- The admin-only management link is the last navigation item, after My works; the old page-top shortcut was removed. It keeps the existing `adminShortcut` ID and role gate, uses the same route, and participates in the mobile tab bar. Tablet headers wrap to two rows to avoid crowding.
- The work page shows a type tile, title and actions in one row, a facts strip, then the cover and description. The owner's note for the weekly pick (`reason`) appears only on that work.
- Not part of this redesign because they need backend work: on-site feedback or comments, filling the form from a pasted link, and per-work share previews.

### November 11 click-dispatch repair
- The sidebar stores the selected category in `html[data-cat]` for styling. Document click delegation must match only `button[data-cat],a[data-cat]`, not every `[data-cat]` ancestor. The broad selector swallowed moderator, like, save, share and report actions.
- Fourteen event-dispatch regressions now exercise the actual registered document listener (including nested icon clicks, moderator restore/trash and ordinary category controls), rather than only calling action functions directly. Eleven reproduce the old bug before the fix; all 167 offline checks pass after it.
- This is a frontend-only repair. Keep the sidebar/weekly-picks design, moderation schema and existing data. Browser verification opens and cancels confirmation dialogs, without executing publication, deletion or other production writes.

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
- The widget uses the official compact layout when its container is narrower than 300px; flexible layout otherwise. Crossing that boundary while idle remounts the widget and invalidates the old token. No sitekey, server secret, challenge requirement or token lifetime was changed. November 10 offline suite: 126 checks (17 frontend, 91 flow/CAPTCHA and 18 related-query/layout checks). Browser geometry checks remain separate from these stub/source checks.

## Database
The November 2 recovery migrations under `supabase/migrations/` have been applied to the existing project. They are **one-time migrations**, not a fresh-install schema or scripts to rerun blindly.

`20261104_storage_listing_and_retired_views.sql` was also applied. The retired browser page-view insert policy now denies writes in addition to the revoked INSERT grants. Cover listing is restricted to each authenticated owner's folder or an existing administrator. The bucket stays public so published image URLs still load. Known public URLs can still be downloaded: this is not DRM or complete erasure after unpublishing. A transaction checked anonymous/ordinary/admin listing and unchanged work/storage data before commit.

On November 10, a separately approved production repair replaced the recursive INSERT quota subquery with `aimade_internal.own_cover_quota_ok()`: zero arguments, current `auth.uid()` only, boolean result, fixed empty search path, controlled postgres SECURITY DEFINER, no anon EXECUTE. `aimade_internal` is not an exposed Data API schema. Existing ownership checks, cover limits, public bucket and all original work/admin rows were preserved. The guarded applied SQL and before/after evidence are retained in the owner's private project outputs, not automatically rerun by a frontend deploy. Postgres future default grants were narrowed; managed `supabase_admin` defaults and dashboard auto-exposure settings were not changed. Review grants/RLS whenever creating a new table or function, including through the dashboard. The old one-time quota migration alone does not represent this repaired state.

`work_catalog` uses `security_invoker=true`; never change it to a definer view. Owners can edit and reversibly unpublish, except they cannot reverse administrator moderation. Administrators can inspect reports through the Supabase dashboard. Unpublishing is not erasure of public cover objects.

## Moderation and publication quality (November 11)
- `#mine` always filters by the signed-in owner's UUID, including for administrators. It excludes Trash. Other people's works never become yours through moderation. Account/route changes invalidate in-flight list/detail responses and clear private moderator rows.
- The separate `#admin` workspace is linked only after the existing `admins` row is verified. It offers Published, Unpublished, Trash and All filters, title/creator search, 24-row pages, and unpublish/republish/trash/recover/delete actions. It does not allow editing another author's content or ownership. The existing backend administrator UPDATE/DELETE policies remain the authority; no new administrator was created and no new privileged RPC was exposed.
- Applied additive migration `20261111_moderation_and_quality.sql` adds `moderation_status` (`clear`, `hidden`, `trash`) and server-controlled `moderated_at`. `archived` remains the public-visibility flag for compatibility. A check requires hidden/trash rows to be archived. An invoker trigger with empty search path uses the existing admin membership to prevent authors from clearing moderation or republishing moderator-hidden works, even through an old client or a direct API call. Direct trigger EXECUTE is revoked.
- Work detail pages expose Unpublish to administrators on any published work and retain the ordinary author's own-work control. Administrators can also republish non-trash archived works there. The existing moderation confirmation, actor checks, origin guard and stale database-state filters are reused; detail confirmations additionally bind the current work and detail-load generation. Route changes dismiss unsubmitted confirmations. Trash/recovery/permanent deletion remain in the management page. No ownership, RLS, database settings or existing work states change in this frontend release.
- Existing archived rows retain their state and owner; the old schema did not record the actor. They are labelled Author-unpublished / legacy, not retrospectively claimed as administrator removals. No existing row was backfilled, republished or deleted during this release.
- Trash is reversible. Recovery returns to the unpublished list, not directly to public. Permanent deletion is a separate confirmation requiring the exact title. It removes that work and cascade-linked likes/reports, not its author account or cover file. UI writes compare ID, title, archived state, moderation state and timestamp to detect stale dialogs. Uncertain outcomes are not automatically retried. The original direct-table admin permissions still exist; the two-step UI is not an API-level deletion retention guarantee.
- Title: 2–120 characters, at least one Unicode letter, not just numbers/symbols. Description: at least 30 non-whitespace code points, up to 2,000 total. Native hints/custom validity and pre-upload validation are backed by a database trigger. The trigger checks inserts and changed title/description fields; unchanged legacy content can still be moderated without being rewritten. ICU Unicode classification is explicitly used in the database. Browser maximum lengths are UTF-16 based and therefore may be slightly stricter for supplementary characters.
- Validation: 224 offline checks (20 frontend + 204 flow/CAPTCHA/related), plus a real local PostgreSQL 18.6 synthetic RLS/trigger test (production is 17.6), and Chrome desktop/320px UI checks. The local test fixture and assertions are in `supabase/tests/fixtures/20261111_moderation_local.sql` and `supabase/tests/20261111_moderation_local.sql`; both guard the dedicated database name `aimade_moderation_qa`. Never run that fixture in Supabase. Production write actions were not exercised on the owner's real works; guarded migration verification checked all 14 original work rows, 3 archived flags, the sole administrator and 4 cover rows remained unchanged.
- Deploy the migration before this frontend. Do not rerun it blindly. Reverting the frontend can leave these additive protections in place; never remove moderation flags or republish works to roll back the UI. Old clients cannot reverse moderator restrictions but may show generic validation errors.

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
