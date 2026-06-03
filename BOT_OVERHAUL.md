# Bot Overhaul Plan — Discord & Telegram

> Goal: turn the bots from "three commands that record a star rating" into a
> proper reputation engine that's interactive, trustworthy, and gives sellers a
> real reason to use Vouched.to as their hub. Pick up phases in order; each is
> independently shippable.

---

## 1. Current state (baseline audit)

Everything lives in `src/bot-manager.ts` — one multi-tenant process, a bot per
user token, polled/synced from the DB.

**Discord** — 3 slash commands:
- `/vouch <rating 1-5> <comment> [proof]` — creates a vouch, enforces the free
  50 limit, optional required proof (R2 upload), custom embed (title/footer/
  colour/count/tag), premium: post to a set channel, ping a role, custom emoji.
- `/stats` — count, avg score, leaderboard rank, plan, expiry, member-since.
- `/restore` — owner-only; re-posts every vouch to the channel sequentially.

**Telegram** — `/start`|`/link`, `/vouch <rating> <comment>` (text **or** photo
with a `/vouch` caption), `/stats`, `/restore`.

### Why usage potential is low today
- **Clunky input** — positional args (`/vouch 5 great seller`); easy to get
  wrong, no validation feedback, no buttons. Telegram has no command menu.
- **No interactivity** — no buttons, modals, inline keyboards, or confirmations.
- **No discovery** — can't look up a profile, see a leaderboard, or browse
  vouches from chat. The profile URL is barely surfaced.
- **No trust layer** — you can vouch yourself, vouch infinitely, no cooldown,
  no blacklist, no reporting/moderation, no proof verification beyond a toggle.
- **No management from chat** — owners can't edit/remove a bad vouch, configure
  the bot, or export data without the dashboard.
- **No automation** — no new-vouch notifications, milestones, or role rewards.
- **Config is per-user, not per-server** — a bot in multiple servers shares one
  set of settings; no per-guild channels/requirements.
- **Thin data model** — a vouch is rating+comment+proof. No type (sale/service/
  trade), no status (active/flagged/removed), no edit history, no seller reply.

---

## 2. Vision

A seller invites their bot, runs `/setup` once, and gets:
- A frictionless, button-driven vouch flow that resists abuse.
- Live, shareable reputation surfaces (profile cards, leaderboards) in-chat.
- Real moderation + automation so they actually rely on it day to day.
- Clear free vs premium value so the bot drives upgrades.

---

## 3. Feature catalogue

Legend: **[D]** Discord · **[T]** Telegram · **[P]** premium-gated · effort S/M/L

### A. Vouch flow UX
- **Button + modal vouch [D]** (M) — a "Leave a vouch" button opens a Discord
  modal (rating select + comment + optional proof upload). Keeps `/vouch` too.
- **Conversational vouch [T]** (M) — telegraf wizard/scene: tap a 1–5 inline
  keyboard, then send the comment, then optional photo. Kills positional args.
- **Confirmation/preview** (S) — show the rendered vouch with a Confirm/Cancel
  before saving.
- **Self-vouch block** (S) — giver can't equal the receiver/owner.
- **Edit / delete own vouch** (M) — giver can amend within a window (e.g. 15 min)
  or delete; owner can always remove. Needs `editedAt` / soft-delete.
- **Vouch types** (M) — optional category (Sale / Service / Trade / Other) and
  an optional "item/amount" field, shown on the card and filterable.

### B. Trust & anti-abuse  *(the biggest gap)*
- **Rate limiting / cooldown** (S) — N vouches per giver per receiver per window.
- **Account-age & membership gates** (S) — require giver account/join age.
- **Blacklist** (M) — owner blocks a giver id; blocked givers can't vouch. New
  `Blacklist` model.
- **Duplicate detection** (S) — block identical/near-identical repeat comments.
- **Min comment length + profanity/link filter** (S).
- **Report a vouch** (M) — anyone reports; lands in an owner moderation queue;
  `/moderate` to approve/remove. New `VouchReport` + vouch `status`.
- **Proof tiers** (S) — off / optional / required / required-for-5★.
- **Negative-review handling** (M) — allow low ratings with a seller reply /
  dispute flow instead of just deleting (more credible profiles).

### C. Discovery & engagement commands
- **`/profile [@user]`** [D][T] (S) — profile link + quick stats card with a
  "View full profile" button.
- **`/leaderboard [server|global]`** [D][T] (M) — top sellers; reuse the web
  aggregation (`vouch.groupBy`).
- **`/recent`** [D][T] (S) — latest N vouches as cards.
- **`/find <keyword|rating>`** [D] (M) — search this seller's vouches.
- **`/help` + `/setup`** [D][T] (S) — onboarding & command list; call Telegram
  `setMyCommands` so commands autocomplete (currently missing).

### D. Owner management from chat
- **`/config`** [D] (L) — configure embed/channel/requirements via modal,
  mirroring the dashboard (per-guild where relevant).
- **`/remove <vouch_id>`** [D][T] (S) — delete a specific vouch (ids already exist).
- **`/export`** [D][T][P] (M) — DM a CSV/JSON of all vouches.
- **Vouch-only channel** [D][P] (M) — designate a channel; auto-delete non-vouch
  messages and keep a pinned live "vouch card". Needs MessageContent intent.

### E. Presentation
- **Richer embeds/cards** (M) — star glyphs, giver avatar/thumbnail, profile-link
  button, vouch number, type badge, permalink to the web vouch.
- **Pinned live profile card** (M) — auto-updating count/score message.
- **Per-vouch web permalink** (S) — `/u/<slug>#vouch-<id>`; print it on the card
  so vouches are verifiable (anti-fake).

### F. Automation & notifications
- **New-vouch DM to owner** (S).
- **Milestone announcements** (S) — 10/50/100th vouch, etc.
- **Role rewards** [D][P] (M) — auto-assign a role at N vouches (needs Manage
  Roles). Distinct from the existing "mention role".
- **Weekly summary DM** [P] (M).

### G. Data integrity & import
- **Import existing vouches** [D][T] (L) — scan channel/chat history and convert
  messages to vouches (roadmap item; high value for switchers).
- **Vouch status lifecycle** (M) — active / flagged / removed instead of hard
  deletes; preserves history & average integrity.

---

## 4. Schema & architecture changes required

These unlock most of the above — do them early.

```prisma
model Vouch {
  // + status        VouchStatus @default(ACTIVE)   // ACTIVE | FLAGGED | REMOVED
  // + type          String?                        // sale | service | trade | other
  // + itemOrAmount  String?
  // + editedAt      DateTime?
  // + sellerReply   String?
  // + sourceName    String?                        // server/group name for context
  @@index([receiverId, createdAt])                  // pagination/feed perf
}

model GuildConfig {            // per-server settings (today config is per-user/global)
  id           String @id @default(cuid())
  userId       String          // owning bot user
  guildId      String          // Discord guild / Telegram chat id
  vouchChannelId String?
  requireProof Boolean @default(false)
  minAccountAgeDays Int @default(0)
  @@unique([userId, guildId])
}

model Blacklist {
  id String @id @default(cuid())
  userId    String   // owner
  platform  String   // discord | telegram
  blockedId String   // giver id
  reason    String?
  @@unique([userId, platform, blockedId])
}

model VouchReport {
  id        String @id @default(cuid())
  vouchId   String
  reporterId String
  reason    String?
  createdAt DateTime @default(now())
}
```

Architecture / library notes:
- **Discord components** (buttons, modals, select menus) need no new gateway
  intent — they arrive as interactions. Handle `isButton()` / `isModalSubmit()`
  in the existing `interactionCreate` listener.
- **Vouch-only channel** auto-delete needs the **MessageContent** privileged
  intent + `messageCreate` handling (only enable per-feature; document it).
- **Role rewards / role mention** need the bot to have **Manage Roles** and sit
  above the target role.
- **Telegram** conversational flows → adopt **telegraf scenes/`WizardScene`** and
  `bot.action` callback handlers for inline keyboards. Call **`setMyCommands`**.
- **Refactor `bot-manager.ts`** — it's ~660 lines and growing. Split into
  `bots/discord/` (commands, components, handlers) and `bots/telegram/`
  (scenes, handlers) with a shared `bots/vouch-service.ts` (create/validate/
  limit/blacklist logic used by both platforms). Prerequisite for sane growth.
- **Per-guild config** means resolving settings by `(userId, guildId)` with
  fallback to user defaults.

---

## 5. Phased rollout (prioritised)

### Phase 0 — Foundations (do first)
- [x] Refactor `bot-manager.ts` into `discord/`, `telegram/`, shared
      `vouch-service.ts`.
- [x] Schema: `Vouch.status` + soft-delete, `editedAt`, `type`, `sourceName`,
      `@@index([receiverId, createdAt])`. Migrate (`prisma db push` on VPS).
- [x] Telegram `setMyCommands`; add `/help` on both platforms.

### Phase 1 — Anti-abuse & integrity (highest trust ROI)
- [x] Self-vouch block, rate limit/cooldown, min comment length.
- [x] `Blacklist` model + `/blacklist add|remove`.
- [x] Report flow (`VouchReport`) + `/moderate` queue + vouch `status`.
- [x] Per-vouch web permalink on cards.

### Phase 2 — Frictionless input
- [x] Discord button + modal vouch flow.
- [x] Telegram wizard (inline rating keyboard → comment → optional photo).
- [x] Confirmation/preview step.

### Phase 3 — Discovery & engagement
- [x] `/profile`, `/leaderboard`, `/recent`, `/find`.
- [x] Richer embeds/cards with profile-link buttons.
- [x] New-vouch DM + milestone announcements.

### Phase 4 — Owner power tools
- [ ] `/config` (in-chat setup) + per-guild `GuildConfig`.
- [ ] `/remove`, `/export` [P].
- [ ] Vouch-only channel + pinned live card [P].
- [ ] Role rewards [P].

### Phase 5 — Migration & growth
- [ ] Import existing vouches from channel/chat history.
- [ ] Negative-review + seller-reply flow.
- [ ] Weekly summary [P].

---

## 6. Free vs Premium framing (drive upgrades)

- **Free:** core vouch flow, `/stats`, `/profile`, `/leaderboard`, `/restore`,
  basic anti-abuse, 50-vouch cap.
- **Premium:** unlimited vouches, vouch-only channel + pinned card, role rewards,
  export, weekly summary, custom channel/emoji/role (existing), multi-profile.
  Surface a clear "Upgrade to unlock" prompt in-bot wherever a gate is hit.

---

## 7. Open questions (decide before building)

- Negative reviews: allow public low ratings, or keep it positive-only with
  private dispute? (Affects credibility vs seller pushback.)
- Per-guild vs per-user config: how much should differ per server?
- Vouch-only-channel auto-delete: worth requiring the MessageContent privileged
  intent (verification hurdle at 100+ servers)?
- Web-based vouching (a public form) — should the bots just deep-link to that for
  some flows instead of re-implementing in-chat?
- Identity: should a giver's vouches across servers be deduped to one identity?

---

_Baseline captured from `src/bot-manager.ts` (commands: `/vouch`, `/stats`,
`/restore`, Telegram `/link`). See `ROADMAP.md` for the broader project tracker;
spam-protection + import items there are folded into Phases 1 and 5 here._
