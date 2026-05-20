# Feature Checklist: MyVouch.es Clone

## Phase 1: Foundation & Web
- [x] **Infrastructure Setup**
  - [x] Initialize Next.js project
  - [x] Setup PostgreSQL database (local or Oracle cloud)
  - [x] Initialize Prisma ORM and create schema
  - [ ] Configure Cloudflare R2 bucket for image storage
- [x] **Authentication**
  - [x] Setup Resend (Magic Links) via Auth.js
- [ ] **User Dashboard**
  - [x] Create authenticated dashboard view
  - [x] Add form to accept and save user's custom Discord Bot Token
  - [x] Display user's vouch count and limit (e.g., 0/50)

## Phase 2: The Discord Bot Engine
- [x] **Bot Manager Service**
  - [x] Build Node.js script to fetch tokens from DB
  - [x] Implement dynamic spawning of `discord.js` clients
  - [x] Apply cache limits to keep RAM usage low
- [x] **Discord Slash Commands**
  - [x] Register `/vouch` command globally or per-guild
  - [x] Register `/stats` command
  - [x] Register `/restore` command
- [x] **Vouch Processing (`/vouch`)**
  - [x] Receive interaction data (rating, comment)
  - [x] Handle image attachments (upload buffer to Cloudflare R2)
  - [x] Save vouch record to PostgreSQL
  - [x] Enforce 50-vouch limit for free users
  - [x] Send confirmation reply in Discord channel

## Phase 3: Public Profiles & Restore
- [x] **Public Web Profiles**
  - [x] Build dynamic Next.js route `/u/[slug]`
  - [x] Fetch and display user's vouches from DB
  - [x] Implement UI for showing R2 images, ratings, and comments
- [x] **Restore Functionality (`/restore`)**
  - [x] Implement logic to query all vouches for a user
  - [x] Iterate and post vouches sequentially to the target channel
  - [x] Implement rate-limit protections (delays between posts)

## Phase 4: Telegram Integration
- [x] **Telegram Foundation**
  - [x] Add Telegram linking to user dashboard
  - [x] Update database schema to handle Telegram IDs and Tokens
- [x] **Telegram Bot Manager**
  - [x] Implement multi-tenant manager using `telegraf`
- [x] **Telegram Commands**
  - [x] Implement `/vouch` equivalent for Telegram
  - [x] Implement `/stats` equivalent for Telegram
  - [x] Implement `/restore` equivalent for Telegram
- [x] **Unified Feed**
  - [x] Update public web profiles to display both Discord and Telegram vouches seamlessly
