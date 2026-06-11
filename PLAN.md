# Implementation Plan: Vouched.to (Reputation Engine)

## Vision
To build a highly scalable, feature-rich reputation management platform. Vouched.to serves as a secure backup for customer testimonials ("vouches"), providing professional public profiles and a robust "insurance policy" against platform bans.

## 2. Core Features & Business Logic

### A. The "Custom Bot" Model
*   **Decentralized Bots:** Every user provides their own Discord and Telegram Bot Tokens.
*   **Multi-Platform:** Support for Discord, Telegram, and direct Website vouches.
*   **The Insurance Policy:** The `/restore` command allows users to instantly re-post their entire vouch history into a new server or channel if their previous one is lost.

### B. Monetization & Plans
*   **Free Tier:** Custom bot, 50 vouch limit, basic profile.
*   **Premium Plan:** Unlimited vouches, custom domain, advanced customization, multiple profiles.
*   **Business Plan:** White-label options, priority support, advanced analytics.

---

## 3. Feature Roadmap (The "Everything You Need" Suite)

### Phase 1: Storage & Connectivity
*   [x] **Store Unlimited Vouches:** Receive via Discord, Telegram, or Website. (Website vouching pending)
*   [ ] **Backup Existing Vouches:** Tools to import existing Discord/Telegram messages as vouches.
*   [x] **Restore Vouches:** `/restore` command for Discord and Telegram.
*   [x] **Custom Bot:** Dedicated managers for individual user bot tokens.

### Phase 2: Professional Presence
*   [ ] **Customizable Website Profile:** Dynamic themes, custom colors, and layout options.
*   [ ] **Custom Domain:** Ability to map `profile.yourdomain.com` to the Vouched.to profile.
*   [ ] **SEO Optimization:** Customizable meta titles, descriptions, and OpenGraph images for profiles.
*   [ ] **Multi-Profile Website:** Manage multiple identities/businesses under a single dashboard account.

### Phase 3: Analytics & Trust
*   [x] **Easy-to-Use Dashboard:** User-friendly management of vouches and settings.
*   [x] **Vouches Stats:** Detailed trends, average ratings, and volume insights.
*   [ ] **Vouch Spam Protection:** User blacklist, rate limiting, and automated spam detection.
*   [ ] **Vouched.to Awards:** Earnable badges based on activity (e.g., "100+ Vouches", "Top Rated").

### Phase 4: Community & Support
*   [ ] **Vouched.to Leaderboard:** Global ranking of the most reputable users.
*   [ ] **24/7 Support:** Integrated help center and ticket system.
*   [ ] **Extendable Plans:** Tiered subscription management (Stripe integration).

---

## 4. Architecture & Scalability

*   **Bot Manager (Node.js):** A lightweight multi-tenant service using `discord.js` and `telegraf`.
    *   *Optimization:* Aggressive cache management to support 1000+ simultaneous bot instances on a single VPS.
*   **Frontend (Next.js):** Server-side rendered profiles for maximum SEO performance.
*   **Database (PostgreSQL + Prisma):** Relational storage for vouches, user settings, and audit logs.
*   **Storage (Cloudflare R2):** S3-compatible, egress-free storage for proof screenshots.

---

## 5. Technical Tasks & Verification

### Ongoing & Upcoming Tasks
1.  **[High] Subscription Logic:** Implement Stripe billing to toggle `isPremium` and unlock limits.
2.  **[Med] Profile Customization:** Add fields to `User` model for `themeColor`, `customCSS`, and `metaDescription`.
3.  **[Med] Vouch Import Tool:** Create a utility command/UI to "scrape" a channel for existing vouch messages.
4.  **[Low] Leaderboard Logic:** Aggregate vouch counts across all users for a global ranking page.

### Verification Plan
*   **Performance:** Monitor VPS RAM/CPU as more bot tokens are added.
*   **Security:** Ensure users can only access/restore their own vouches.
*   **Integrity:** Verify that "Unlimited" really works for Premium users without database bottlenecks.
