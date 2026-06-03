# Vouched.to

A reputation platform: a secure backup for customer testimonials ("vouches")
collected via users' own Discord and Telegram bots, with public profiles as an
"insurance policy" against platform bans.

## Stack

- **Next.js 16** (App Router) + React 19, Tailwind v4
- **PostgreSQL** via **Prisma**
- **NextAuth v5** (magic-link via Resend + credentials)
- **Bot manager** — multi-tenant Discord (`discord.js`) + Telegram (`telegraf`)
  service that spawns a bot per user token (`src/bot-manager.ts`)
- **Cloudflare R2** (S3-compatible) for proof images
- External **payments site** owns premium state via a signed webhook

## Local development

```bash
npm install
npx prisma generate
npm run dev        # web app on http://localhost:3000
npm run bot        # bot manager (separate process)
npm test           # node:test suite
```

Set up `.env` first — see **[DEPLOY.md](./DEPLOY.md)** for the full list of
environment variables.

## Key paths

- `src/app/u/[slug]/` — public profile (+ OG image)
- `src/app/dashboard/` — user dashboard (bot config, profile, Design Studio)
- `src/app/admin/` — admin console
- `src/app/api/payments/webhook/` — incoming payment events
- `src/bot-manager.ts` — Discord/Telegram bot engine
- `src/lib/premium.ts` — `hasActivePremium()` (the premium gate everywhere)

## Docs

- **[AGENTS.md](./AGENTS.md)** — conventions for working in this repo
- **[DEPLOY.md](./DEPLOY.md)** — VPS / PM2 deployment + environment variables
- **[ROADMAP.md](./ROADMAP.md)** — living tracker of done / outstanding work
