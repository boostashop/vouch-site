# Implementation Plan: MyVouch.es Clone

## 1. Objective
To build a highly scalable, low-cost clone of MyVouch.es. The platform will serve as a secure backup for customer testimonials ("vouches") and provide public web profiles. It will run efficiently on an Oracle Ampere VPS (while free) and use Cloudflare R2 for scalable image storage. It will feature multi-tenant bot architecture for both Discord and, eventually, Telegram.

## 2. Core Features & Business Logic (The "MyVouch" Model)

Based on deeper research into the target platform, here is how the core business logic operates:

*   **Custom Bots for Everyone:** The core hook of the platform is that *every* user (even free users) provides their own Discord Bot Token. They don't invite a massive "MyVouch bot" to their server; they invite *their own* bot, which is powered by our backend.
*   **The Monetization Strategy:**
    *   **Free Tier:** Gets their custom bot, custom domain, and profile, but is **hard-capped at 50 stored vouches**.
    *   **Paid Tiers ($2.99 - $4.99/mo):** Unlocks unlimited vouch storage and the ability to manage multiple profiles/bots under one account.
*   **The "Insurance Policy":** The `/restore [channel]` command is the killer feature. If a server/group is banned, they spin up a new one, run `/restore`, and their custom bot rapidly re-posts all their saved vouches into the new channel.

## 3. Architecture for 1000+ Users (Multi-Tenant Bot System)

Scaling to 1000 users means our backend might eventually need to maintain 1000 simultaneous connections to Discord/Telegram. 

*   **Frontend / User Dashboard:** Next.js + Tailwind CSS. Hosted alongside the API.
*   **API / Web Server:** Node.js (Express or Next.js API Routes).
*   **The Bot Manager (The Critical Component):** Dedicated Node.js services responsible for dynamically spinning up, managing, and tearing down bot client instances based on tokens stored in the database.
    *   *Discord Optimization:* Limit the `discord.js` cache (ignoring presences, typing indicators, and message caching for anything other than commands) to keep RAM usage low.
    *   *Telegram Manager:* Similar architecture using `telegraf` or a similar Node.js Telegram bot library.
*   **Database:** PostgreSQL (via Prisma). Fast, relational, and easily runs on the Oracle VPS.
*   **Storage:** Cloudflare R2. (10GB free/month, $0 egress). Perfect for storing vouch image attachments permanently without bloating the VPS disk.

## 4. Database Schema (Prisma)

```prisma
model User {
  id               String   @id // Primary ID (could be UUID or Discord ID)
  discordId        String?  @unique // Used for Discord OAuth login
  discordName      String?
  telegramId       String?  @unique // For future Telegram linking
  isPremium        Boolean  @default(false)
  discordBotToken  String?  // The user's custom Discord bot token
  telegramBotToken String?  // The user's custom Telegram bot token
  customDomain     String?
  vouches          Vouch[]  @relation("ReceivedVouches")
}

model Vouch {
  id              String   @id @default(uuid())
  receiverId      String   // Links to User
  platform        String   // "discord" or "telegram"
  giverId         String   // ID of the person who left the vouch (Discord ID or Telegram ID)
  giverName       String
  sourceId        String   // Server ID or Telegram Group ID
  rating          Int      // 1-5
  comment         String?
  proofImageUrl   String?  // Cloudflare R2 URL
  createdAt       DateTime @default(now())

  receiver        User     @relation("ReceivedVouches", fields: [receiverId], references: [id])
}
```

## 5. Implementation Phases

### Phase 1: Foundation & Web
1.  **Infrastructure Setup:** Provision Oracle VPS, install Node.js, PostgreSQL. Setup Cloudflare R2 bucket.
2.  **Web App Shell:** Initialize Next.js, setup Prisma, configure NextAuth for Discord Login.
3.  **User Dashboard:** Build the UI for users to paste their Custom Bot Token and view their vouch limit (x/50).

### Phase 2: The Discord Bot Engine
4.  **Bot Manager Service (Discord):** Write a Node.js script that connects to the DB, fetches all active `discordBotToken`s, and spawns a lightweight `discord.js` client for each. 
5.  **Slash Command Registration:** Automate the registration of `/vouch`, `/stats`, and `/restore` slash commands for every active Discord bot token.
6.  **`/vouch` Implementation:** When a bot receives a vouch, upload the attachment to Cloudflare R2, save the record to PostgreSQL, and reply to the channel. Enforce the 50-vouch limit for free users.

### Phase 3: Public Profiles & Restore
7.  **Public Web Profiles:** Build the Next.js dynamic route (`/u/[username]`) to beautifully display the data from PostgreSQL, differentiating platform sources if needed.
8.  **`/restore` Implementation (Discord):** Build the logic for a bot to query its owner's vouches from the DB and sequentially post them into the designated Discord channel (with slight delays to avoid rate limits).

### Phase 4: Telegram Integration (The Competitive Edge)
9.  **Telegram Auth & Linking:** Allow users to link their Telegram account in the dashboard.
10. **Bot Manager Service (Telegram):** Implement a similar multi-tenant manager using `telegraf` to manage `telegramBotToken`s.
11. **Telegram Commands:** Implement `/vouch`, `/stats`, and `/restore` equivalents for Telegram groups.
12. **Unified Feed:** Ensure the public web profile seamlessly blends vouches received from both Discord and Telegram.

## 6. Verification Plan
*   **Storage Test:** Verify image uploads flow correctly from a Discord/Telegram interaction -> Node.js Buffer -> Cloudflare R2 -> R2 Public URL.
*   **Multi-Bot Test:** Provision separate test accounts, provide different bot tokens, and verify both bots come online and process commands independently.
*   **Memory Profiling:** Monitor the RAM usage of the Node.js bot managers with 5-10 bots connected to ensure the cache limitations are effective for scaling on the Oracle VPS.
