# Feature Checklist: MyVouch.es Clone

## Phase 1: Foundation & Web
- [ ] **Infrastructure Setup**
  - [ ] Initialize Next.js project
  - [ ] Setup PostgreSQL database (local or Oracle cloud)
  - [ ] Initialize Prisma ORM and create schema
  - [ ] Configure Cloudflare R2 bucket for image storage
- [ ] **Authentication**
  - [ ] Setup Discord OAuth2 via NextAuth.js
- [ ] **User Dashboard**
  - [ ] Create authenticated dashboard view
  - [ ] Add form to accept and save user's custom Discord Bot Token
  - [ ] Display user's vouch count and limit (e.g., 0/50)

## Phase 2: The Discord Bot Engine
- [ ] **Bot Manager Service**
  - [ ] Build Node.js script to fetch tokens from DB
  - [ ] Implement dynamic spawning of `discord.js` clients
  - [ ] Apply cache limits to keep RAM usage low
- [ ] **Discord Slash Commands**
  - [ ] Register `/vouch` command globally or per-guild
  - [ ] Register `/stats` command
  - [ ] Register `/restore` command
- [ ] **Vouch Processing (`/vouch`)**
  - [ ] Receive interaction data (rating, comment)
  - [ ] Handle image attachments (upload buffer to Cloudflare R2)
  - [ ] Save vouch record to PostgreSQL
  - [ ] Enforce 50-vouch limit for free users
  - [ ] Send confirmation reply in Discord channel

## Phase 3: Public Profiles & Restore
- [ ] **Public Web Profiles**
  - [ ] Build dynamic Next.js route `/u/[username]`
  - [ ] Fetch and display user's vouches from DB
  - [ ] Implement UI for showing R2 images, ratings, and comments
- [ ] **Restore Functionality (`/restore`)**
  - [ ] Implement logic to query all vouches for a user
  - [ ] Iterate and post vouches sequentially to the target channel
  - [ ] Implement rate-limit protections (delays between posts)

## Phase 4: Telegram Integration
- [ ] **Telegram Foundation**
  - [ ] Add Telegram linking to user dashboard
  - [ ] Update database schema to handle Telegram IDs and Tokens
- [ ] **Telegram Bot Manager**
  - [ ] Implement multi-tenant manager using `telegraf` (or similar)
- [ ] **Telegram Commands**
  - [ ] Implement `/vouch` equivalent for Telegram
  - [ ] Implement `/stats` equivalent for Telegram
  - [ ] Implement `/restore` equivalent for Telegram
- [ ] **Unified Feed**
  - [ ] Update public web profiles to display both Discord and Telegram vouches seamlessly
