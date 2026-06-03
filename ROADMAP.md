# Vouched.to — Roadmap & Cleanup Tracker

Living checklist of outstanding work, derived from the full-project review on
2026-06-03. Cross items off as they land. Grouped by priority.

---

## ✅ Done (this session)

- [x] Removed dead billing surface (`/dashboard/billing` link, landing "Pricing"
      nav + footer links — there is no pricing page; payments live on the
      external site).
- [x] **Payments integration** — external payments site is the source of truth:
  - [x] Incoming webhook `POST /api/payments/webhook` (HMAC-SHA256 verified,
        replay-protected) → toggles `isPremium` + `premiumExpiresAt`.
  - [x] Outgoing **link-out** checkout (`getCheckoutUrl`) — "Upgrade" buttons
        link to the payments site with `?ref=<userId>&return=<dashboard>`.
  - [x] Schema: added `premiumExpiresAt` and `paymentCustomerId` to `User`.
  - [x] `hasActivePremium()` helper (`src/lib/premium.ts`) — local safety net so
        access lapses on expiry even if an "expired" webhook is missed. Wired
        into all server-side premium gates (bot limits/features, profile
        custom-CSS/domain/Design-Studio, public-profile badges, leaderboard).
  - [x] Wired the previously-dead `statsShowExpiration` setting (Discord +
        Telegram `/stats` now show renew/expiry date).
  - [x] Gated custom domain save to premium (was saved for everyone despite the
        disabled input).
- [x] Fixed light-mode invisible brand wordmark + nav hover on landing page.

### ⚠️ Deploy steps for the payments work
- [ ] Run `prisma db push` (or migrate) on the VPS — schema changed.
- [ ] Set env vars on the VPS / `.env`:
      - `PAYMENTS_URL` — base URL of the payments site (checkout link-out).
      - `PAYMENTS_WEBHOOK_SECRET` — shared HMAC secret for the webhook.
- [ ] On the **payments site**, implement the matching sender:
      - Headers: `x-vouched-timestamp` (unix secs), `x-vouched-signature`
        (hex HMAC-SHA256 of `` `${timestamp}.${rawBody}` ``).
      - Body: `{ event, userId, customerId, expiresAt }`.
      - Events handled: `subscription.activated|renewed`, `payment.succeeded`
        (→ premium ON); `subscription.cancelled|expired`, `payment.refunded`
        (→ premium OFF). First event for a user must include `userId` (the
        `ref`); we store `customerId` for subsequent lookups.
- [ ] End-to-end test: checkout → webhook → premium flips on → expiry lapses.

---

## 🔴 Security (from review)

- [ ] **`vps.key` committed** — _user handling at go-live_ (rotate key + purge
      from git history; add to `.gitignore`).
- [ ] **Reflected XSS / CSS-injection via `?t=` on every profile**
      (`src/app/u/[slug]/page.tsx` → `dangerouslySetInnerHTML` of unsanitised
      tokens; `customCSS` appended raw). Validate/escape tokens or stop reading
      them from the query string.
- [ ] **Bot tokens echoed to the browser** (`dashboard/bot/page.tsx` renders the
      saved token as `defaultValue` in a password field) and stored plaintext.
      Show a masked "configured" state; consider encrypting at rest.
- [ ] **Telegram proof URLs leak the bot token** when R2 is unconfigured
      (`bot-manager.ts` stores the `api.telegram.org/file/bot<TOKEN>/…` URL).
      Require R2 for proofs; drop proof on upload failure.
- [ ] **`postMessage` listener has no origin check** (`u/[slug]/page.tsx`).
      Validate `e.origin` before applying preview CSS.

---

## 🟠 Unfinished features

- [ ] **Admin Settings page is all dead UI** (`admin/settings/page.tsx`): Global
      Bot Sync, Prune Sessions, Maintenance Mode, API key — no handlers.
- [ ] **`profileCustomCSS` dead path** — saved (premium) but never rendered.
      Decide: render it on the profile, or remove the field (Design Studio's
      token `customCSS` already covers this).
- [ ] **`vouchRoleId`** collected + saved but the bot never assigns a role.
- [ ] **`statsShowLeaderboard`** saved but never used in `/stats`.
- [ ] **Admin Users**: search box and the `⋮` row menu are non-functional.
- [ ] **Dashboard "+0 this week"** is hardcoded — compute real weekly trend.
- [ ] Roadmap gaps from `PLAN.md`: website-based vouching, vouch import/scrape
      tool, spam protection (blacklist / rate limiting), support/ticket system.

---

## 🟡 Bugs / correctness

- [ ] **Bot manager ignores token changes** — only spawns "if not exists"; edits
      don't take effect until a full restart, and a bad token is retried every
      60s forever (rate-limit risk). Track the token used to spawn; respawn on
      change; back off on auth failure.
- [ ] **Discord intents vs setup guide mismatch** — guide tells users to enable
      Message Content / Server Members; bot requests neither and doesn't need
      them. Fix the guide copy.
- [ ] **'glass' profile theme isn't premium-gated** despite its "Premium" label.
- [ ] **`customDomain` lacks `@unique`** in the schema but is resolved with
      `findFirst` — two users could claim the same domain.
- [ ] **Free-tier 50-vouch limit is racy** (count-then-create not atomic).
- [ ] **`debug: true` in `auth.ts`** + very chatty bot logging (logs every
      Telegram update) — quiet down for production.

---

## 🟢 Scalability

- [ ] **Leaderboard & public profile load all rating rows into memory** and
      don't paginate — contradicts "unlimited vouches". Use `_avg`/`_count`
      aggregations + paginate the wall of vouches.
- [ ] **Single-process bot manager is a SPOF** — no health checks, backoff, or
      per-tenant isolation; one crash drops every user's bot.

---

## ⚪ Hygiene

- [ ] Remove the 7 ad-hoc debug scripts at repo root (`check-users.js`,
      `get-token.js` — dumps a token —, `promote-user.js`, etc.).
- [ ] Consolidate the overlapping docs (`PLAN.md`, `CHECKLIST.md`, `GEMINI.md`,
      `SESSION_SUMMARY.md`, `DEPLOY.md`) — several are stale/contradictory.
- [ ] Add dark-mode variants to admin pages (`admin/settings`, `admin/users` are
      hardcoded dark).
- [ ] No tests anywhere — add at least webhook-signature + `hasActivePremium`
      coverage.
