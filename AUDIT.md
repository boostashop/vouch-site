# Vouched.to — Full Codebase Audit (2026-06-11)

**Status 2026-06-11:** all P0s, all P1s, and all P2s except #23 fixed &
deployed (see ✅ markers). Remaining: #23 (webhook dedupe/ordering), #19
(clear-to-empty embed fields, arguably intentional), and the P3 cleanup list
(ephemeral deprecation, weekly-summary fragility, command-registration
caching, uuid dep, more tests, lint debt, admin placeholders, EMAIL_FROM).

Deep-dive review of every source file (~11.5k LOC: web app, Discord/Telegram
bots, auth, payments, admin). Ordered by priority — fix P0s before promoting
the site. File:line references are to the `dev` branch as of this date.

---

## P0 — Critical (security / data integrity)

### 1. ✅ FIXED — Telegram account takeover via `/start` / `/link`
`src/bots/telegram/index.ts:264` — **anyone** who messages a user's bot and
sends `/start` or `/link` is written to `user.telegramId` unconditionally.
Every owner-only check (`/remove`, `/blacklist`, `/moderate`, `/export`,
`/restore`, `/config`, `/reply`) compares against `telegramId`, so a stranger
can hijack owner powers, delete vouches, export data, and receive owner DMs.
**Fix:** issue a one-time link code in the dashboard and require
`/link <code>`; never overwrite an existing `telegramId` silently.

### 2. ✅ FIXED — Soft-deleted (REMOVED/FLAGGED) vouches still shown almost everywhere
The moderation system sets `status: REMOVED`, but most read paths never filter:
- `src/app/u/[slug]/page.tsx:54-63` — public profile count, average, and feed
- `src/app/u/[slug]/badge/route.tsx:59-62` — embeddable badge stats
- `src/app/u/[slug]/opengraph-image.tsx:19-22` — OG image stats
- `src/app/leaderboard/page.tsx:13` — web leaderboard groupBy (no `where`)
- `src/bots/vouch-service.ts:43` — `getLeaderboardRank` raw SQL
- Discord/Telegram `/stats`, `/profile`, pinned live card — `vouchesReceived`
  include with no status filter
- `src/app/dashboard/page.tsx`, `dashboard/vouches/page.tsx`, admin pulse page

A removed scam vouch (or a 1-star the seller "moderated") still counts and
displays publicly — moderation is cosmetic. **Fix:** add a shared
`ACTIVE`-only filter (e.g. `activeVouchWhere(receiverId)`) and apply it to
every public/stat read; decide explicitly which admin views show all statuses.

### 3. ✅ FIXED — "Require proof" and the free 50-vouch limit are bypassable
- Discord button/modal flow (`discord/index.ts:1200-1543`): the
  modal → preview → confirm path never checks `config.requireProof` and offers
  no proof upload, so the proof requirement only applies to direct
  `/vouch rating comment proof` invocations.
- Telegram wizard (`telegram/index.ts:53-246`): "Skip Proof" is always offered
  even when `requireProof` is on, and the wizard's confirm step **never checks
  `FREE_VOUCH_LIMIT`** — free users can exceed 50 vouches via the wizard.

### 4. ✅ FIXED — Design-token CSS injection (premium users)
`saveDesignTokens` (`dashboard/profile/actions.ts:59`) stores the client
payload verbatim — no validation of any field. `configToCSS` interpolates the
values into a `<style>` tag; only `</style` is stripped. A malicious premium
user can inject arbitrary CSS (overlay phishing, `url()` beacons) into a page
that says "Reputation verified by Vouched.to". **Fix:** validate server-side —
hex/rgba regex for colors, clamp numbers, whitelist enums.

---

## P1 — High (bugs users will hit)

### 5. ✅ FIXED — Vouch saved but reported as failed → duplicates
Discord `/vouch` (`discord/index.ts:233-402`): the vouch row is created, then
embed building / channel sends / DMs run in the same `try`. Any later error
(e.g. invalid `vouchEmbedColor` crashing `setColor`, channel perms) falls into
`catch`, which replies "❌ Failed to save vouch. Please try again" — the giver
retries and a duplicate is recorded. Also, `interaction.reply` in that catch
throws "already acknowledged" if the failure happened after the reply.
**Fix:** create the vouch, ack success, then do side-effects in their own
try/catches; sanitize embed colors like the badge route does.

### 6. ✅ FIXED — `/dashboard/bot` 500s on undecryptable tokens
`dashboard/bot/page.tsx:31` uses `decryptSecret` (throws) instead of
`tryDecryptSecret`. If `TOKEN_ENCRYPTION_KEY` is unset (it is **still unset in
prod** per the security follow-ups) or a row is corrupt, the page crashes with
the generic "couldn't load" screen.

### 7. ✅ FIXED — Telegram Markdown injection / broken replies
User comments and names are interpolated into `parse_mode: "Markdown"` strings
throughout `telegram/index.ts`. Unbalanced `*`/`_`/`[` in a comment makes
Telegram reject the whole message — the vouch is recorded but the confirmation
(and owner DM) silently fails. Also allows link-text injection.
**Fix:** switch to `parse_mode: "HTML"` with an escape helper.

### 8. ✅ FIXED — Admin premium toggle ignores `premiumExpiresAt`
`admin/actions.ts:14` sets `isPremium: true/false` but never touches
`premiumExpiresAt`. For a user whose premium previously expired (stale past
date), `hasActivePremium` stays **false** even after an admin enables premium.
**Fix:** clear `premiumExpiresAt` on toggle-on.

### 9. ✅ FIXED — Stale JWT role/username
`auth.config.ts` bakes `role` into the JWT at sign-in only. Granting admin
does nothing until the user re-logs; **revoking admin does not lock them out**
(proxy + `ensureAdmin` both read the JWT). **Fix:** re-read role from DB in the
`jwt` callback (or short-lived re-validation).

### 10. ✅ FIXED — `/import` fabricates reputation
`discord/index.ts:1098` converts every ≥4-char human message in a channel into
a vouch, defaulting to **5 stars**, skipping blacklist/self-vouch/rate-limit
validation and the free limit, with no preview or undo. It's also an N+1 dup
query per message. This undermines the platform's core trust claim ("verified
vouches"). **Fix:** gate behind premium + explicit confirmation, run
`validateVouchRules`, mark imported vouches (`type: "imported"`), and consider
not defaulting to 5★.

### 11. ✅ FIXED — `/restore` ACTIVE-only + concurrency guard
Both bots (`discord/index.ts:533`, `telegram/index.ts:460`) restore with no
status filter and no in-flight guard — a 1,000-vouch history is ~25 min of
sends, and the owner can start it multiple times in parallel.

### 12. ✅ FIXED — `pendingDiscordVouches` never expires
`discord/index.ts:39` — entries are only deleted on confirm/cancel. Abandoned
previews accumulate forever in a shared multi-tenant process. Add a TTL sweep.

### 13. ✅ FIXED — No `error.tsx` / `not-found.tsx` anywhere
Any thrown server action or page error (slug conflict in `updateProfile`,
decrypt failure, DB hiccup) renders Next's bare "something went wrong / Reload"
screen — which is exactly what was reported on `/upgrade`. Add root +
dashboard error boundaries with friendly retry UI, and surface action errors
as form feedback instead of throws (e.g. slug-taken currently throws → 500
screen instead of an inline message).

---

## P2 — Medium (half-baked features & consistency)

### 14. ✅ FIXED — Web dashboard has no moderation
`dashboard/vouches/page.tsx` is read-only: no remove/reply/report-queue, no
status badges (REMOVED vouches look identical), no pagination (loads every
row), `vouch: any`. All moderation is bot-command-only. Build the web
moderation UI (list FLAGGED, approve/remove, reply, blacklist manager).

### 15. ✅ FIXED — "System Health: Online" is fiction
`dashboard/page.tsx:114` shows "Online / Bot is listening" purely because a
token exists. The bot manager (separate PM2 process) has no heartbeat. If the
token is revoked or spawn fails (backoff map), users still see "Online".
**Fix:** have the manager write `lastSeenAt`/`status` per bot to the DB and
surface real status (+ spawn errors like "invalid token") in the dashboard.

### 16. ✅ FIXED — Dashboard copy bugs
- "Share Profile" action item is always `status="pending"` even with a slug.
- Copy says profile lives at `your-slug.vouched.to` — subdomains don't exist;
  it's `vouched.to/u/<slug>` (`dashboard/page.tsx:197`).
- `hasBot` ignores `telegramBotToken` (`dashboard/page.tsx:47`) — Telegram-only
  users see "Offline / No token provided".

### 17. ✅ FIXED — Custom-domain quirks
`_domain/[host]/page.tsx` doesn't forward `searchParams`, so pagination is
stuck on page 1 for custom domains. Worse, every path on a custom domain is
rewritten to the profile, so the "Get Your Profile" CTA (`href="/"`) loops back
to the same profile — it should link to `https://vouched.to/` absolutely.
`customDomain` input is also saved unvalidated (no hostname regex, could
contain a path/scheme).

### 18. ✅ FIXED — Duplicate accent-color inputs
`dashboard/profile/page.tsx:132-146` has two inputs both named
`profileAccentColor` (color picker + hex text). Only the first is read — the
text field is dead UI. Also no server-side hex validation (the badge route
sanitizes, the profile page and bot embeds don't).

### 19. `updateVouchSettings` quirks
`vouchEmbedTitle/Footer/Color || undefined` means fields can never be cleared
back to empty/default; premium-only fields (channel, role, emoji) are saved
for free users too (harmless — bot gates at read — but confusing).

### 20. ✅ FIXED — User model has no `createdAt`
"Member Since" in `/stats` falls back to `emailVerified`, which is null for
credentials signups → "N/A". Add `createdAt`/`updatedAt` to `User` (and
backfill).

### 21. ✅ FIXED — FK relations/cascade + account deletion
`VouchReport.vouchId`, `Blacklist.userId`, `GuildConfig.userId` have no
relations; `Vouch.receiver` has no `onDelete`. Admin `deleteVouch` leaves
orphaned reports; deleting a user row is impossible while vouches exist. There
is also **no account deletion** feature at all (GDPR exposure — the privacy
policy presumably promises deletion).

### 22. ✅ FIXED — Vouch-only channel deletes the owner's messages too
`discord/index.ts:79-92` deletes every non-bot message in the configured vouch
channel, including the owner/admins. Exempt the owner (and maybe users with
Manage Messages).

### 23. Webhook robustness
`api/payments/webhook/route.ts`: no event-id dedupe (same signed request can
replay within the 300 s window), no ordering guard (a delayed `activated` can
overwrite a newer `cancelled`). Low risk today; add an event id + processed-at
table when convenient.

### 24. ✅ FIXED — Auth hardening gaps (register race, case-insensitivity, rate limiting)
- No rate limiting on credentials login, registration, or magic-link sends
  (email-bomb / credential-stuffing vector).
- `register()` race: unique-constraint violation between `findFirst` and
  `create` throws an unhandled error → 500 instead of the friendly message.
- Usernames are case-sensitive-unique ("Jack" and "jack" can coexist) while
  Telegram `/profile` lookups are case-insensitive — pick one.
- No password reset flow for credentials accounts (magic link only works if
  the email matches, which it does — but the UI never says so).

### 25. ✅ FIXED — OG/badge images render emoji as tofu
`u/[slug]/opengraph-image.tsx` ("★", "✓ Verified") renders missing-glyph boxes
(seen in generated output). Replace glyph characters with inline SVG (as the
badge chip now does for the logo) or load a font into `ImageResponse`.

### 26. ✅ FIXED — Leaderboard page is `force-dynamic` and unauthenticated
`leaderboard/page.tsx` hits the DB (groupBy over all vouches) on every request.
Switch to `revalidate = 300` like the landing page — same freshness, cacheable.

---

## P3 — Improvements / cleanup

- ✅ **`/help` drift (Discord)** — FIXED, now lists all commands.
- _(old note)_ `/help` drift (Discord): lists 7 commands; `/profile`, `/leaderboard`,
  `/recent`, `/find`, `/config`, `/reply`, `/export`, `/import`, `/remove`
  exist but aren't mentioned.
- **`ephemeral:` deprecation:** discord.js v14.26 wants `flags: MessageFlags.Ephemeral`.
- **Weekly summaries are restart-fragile** (`bots/manager.ts:127`): the hourly
  tick only fires if the process is alive at some minute of Sunday 18:xx; PM2
  restart history (250+) makes misses likely. Track `lastSummaryAt` per user
  and send when overdue instead.
- **Bot process scaling:** one Node process hosts every tenant's Discord
  client; `syncBots` re-queries all users every 60 s. Fine now, but add
  `lastSeenAt` heartbeat + per-spawn error reporting (pairs with #15).
- **`registerDiscordCommands` runs on every spawn** for every bot — global
  command PUT each boot; cache a hash and skip when unchanged to avoid rate
  limits as tenants grow.
- **Free-limit TOCTOU:** `count` then `create` lets simultaneous vouches exceed
  50 slightly. Acceptable; document or use a transaction if it matters.
- **`dashboard/vouches` / dashboards:** add pagination and proper Vouch typing.
- **Tests:** only `crypto`, `payments`, `premium`, `design-tokens` have tests.
  The highest-risk logic (`validateVouchRules`, webhook handler, `getActiveConfig`)
  has none. No CI configured.
- **Lint debt:** pre-existing errors (`react/no-unescaped-entities` in
  signin, `no-explicit-any` in leaderboard) keep `npm run lint` red — fix so
  lint can gate.
- **PM2 restart counts are alarming** (vouch-site ~790, vouch-bot ~260).
  Investigate `pm2 logs` error history; add `max_memory_restart` config and an
  alert (some restarts were the port-3000 conflict, but not all).
- **Admin settings page is mostly placeholders** ("Maintenance Mode — coming
  soon", "Global API Access — coming soon") — ship or remove.
- **Admin can't manage users fully:** no user delete, no token revoke, no
  premium-with-expiry grant, no impersonation/audit log.
- **`EMAIL_FROM` defaults to `onboarding@resend.dev`** — make sure prod sets a
  branded sender.
- **`uuid` dependency is only used for v4** — `crypto.randomUUID()` covers it;
  drop the dep.

---

## Carry-over operational items (from ROADMAP.md / memory)

- [ ] Set `TOKEN_ENCRYPTION_KEY` in prod, then run
      `npx tsx scripts/reencrypt-bot-tokens.ts --apply`.
- [ ] Rotate the previously-leaked VPS key.
- [ ] `prisma db push` on the VPS for any pending schema changes, then run
      `npx tsx scripts/rebrand-embed-defaults.ts --apply` (MyVouches → Vouched.to
      strings in existing rows).
- [ ] Payments site: create the three Premium products matching
      `premium-30d/90d/365d` slugs; set `PAYMENTS_URL`, `PAYMENTS_STORE_SLUG`,
      `PAYMENTS_WEBHOOK_SECRET` in prod.

---

## Suggested fix order

1. **P0 #1** Telegram link takeover (small, critical).
2. **P0 #2** ACTIVE-status filter helper applied everywhere (mechanical, high value).
3. **P0 #3** proof/limit enforcement in modal + wizard paths.
4. **P1 #5/#7** bot error-handling + Markdown escaping (stops dup vouches & silent failures).
5. **P1 #6/#13** `tryDecryptSecret` in bot page + `error.tsx` boundaries.
6. **P0 #4** design-token validation.
7. Then P1 the rest, then P2 feature work (web moderation, real bot status).
