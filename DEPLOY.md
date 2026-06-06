# Deployment Guide

This app runs on a VPS (this machine) managed with **PM2**. The Git remote is `github-personal:boostashop/vouch-site.git`.

## Stack

- **Framework**: Next.js 16 (Turbopack)
- **Database**: PostgreSQL via Prisma
- **Process manager**: PM2
- **Port**: 3000 (served via reverse proxy on the VPS)

## Processes

| PM2 name    | What it does                          |
|-------------|---------------------------------------|
| `vouch-site`| Next.js production server (`next start -p 3000`) |
| `vouch-bot` | Discord/Telegram bot (`tsx src/bot-manager.ts`)  |

## Deploy a change (standard flow)

```bash
# 1. Make your changes locally, then push
git add <files>
git commit -m "your message"
git push origin dev

# 2. On the VPS — pull, build, restart
cd /home/ubuntu/vouches
git pull origin dev
npm install                # if dependencies changed
npx prisma generate        # if prisma/schema.prisma changed
npx prisma db push         # if prisma/schema.prisma changed (applies new columns)
npm run build
pm2 restart vouch-site
pm2 restart vouch-bot      # if src/bot-manager.ts or the schema changed
```

> **Note:** restart `vouch-bot` whenever the bot code or schema changes — it
> runs in its own process and won't pick up changes from a `vouch-site` restart.

Run `npm test` locally before pushing — it covers the payment webhook
signature, premium-expiry logic, and the profile CSS sanitizer.

## Common PM2 commands

```bash
pm2 list                  # show all processes and status
pm2 logs vouch-site       # live logs for the web app
pm2 logs vouch-bot        # live logs for the bot
pm2 restart vouch-site    # restart web app (after a build)
pm2 restart vouch-bot     # restart the bot
pm2 save                  # save process list so it survives reboots
pm2 startup               # generate systemd unit (run once after a fresh install)
```

## Environment variables

Stored in `.env` at the project root (not committed to git).

**Core:**
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret
- `AUTH_URL` — canonical app URL (e.g. `https://vouched.to`); used for the main
  host check in `proxy.ts` and the checkout return URL
- `AUTH_RESEND_KEY` — Resend API key for magic-link emails
- `EMAIL_FROM` — from-address for magic-link emails
- `TOKEN_ENCRYPTION_KEY` — secret used to derive the AES-256-GCM key that
  encrypts users' Discord/Telegram bot tokens at rest. Required for bots to
  start and for the bot settings page. Generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
  **Rotating this value makes existing encrypted tokens undecryptable** — users
  would need to re-enter their bot tokens.

**Proof storage (Cloudflare R2, S3-compatible):** if unset, proofs are skipped
rather than stored.
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`,
  `R2_PUBLIC_URL`

**Payments (external payments site):**
- `PAYMENTS_URL` — base URL of the payments site (checkout link-out)
- `PAYMENTS_WEBHOOK_SECRET` — shared HMAC secret for `POST /api/payments/webhook`

## Payments integration

Premium state is owned by the external payments site. See `ROADMAP.md` (top
section) for the webhook contract: HMAC headers, body shape, and event names.
The webhook flips `isPremium` / `premiumExpiresAt`; `hasActivePremium()` enforces
expiry app-wide. The "Upgrade" buttons link out to `PAYMENTS_URL` with the
user's id as `ref`.

## Theme / light-dark mode

The app uses `next-themes` with `attribute="class"` and `defaultTheme="dark"`. The `.dark` class is toggled on `<html>`. All pages use Tailwind `dark:` variants — nothing is hardcoded to a specific colour scheme.

## Branches

- `main` — production-stable
- `dev` — active development; currently deployed to the VPS
