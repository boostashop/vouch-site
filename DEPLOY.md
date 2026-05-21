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
npm run build
pm2 restart vouch-site
```

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

Stored in `.env` at the project root (not committed to git). Required keys:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret
- `AUTH_RESEND_KEY` — Resend API key for magic-link emails
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` — OAuth (if used)
- `AWS_*` — S3 credentials for vouch media

## Theme / light-dark mode

The app uses `next-themes` with `attribute="class"` and `defaultTheme="dark"`. The `.dark` class is toggled on `<html>`. All pages use Tailwind `dark:` variants — nothing is hardcoded to a specific colour scheme.

## Branches

- `main` — production-stable
- `dev` — active development; currently deployed to the VPS
