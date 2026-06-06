// Entry point for the bot process (PM2 runs `tsx src/bot-manager.ts`).
// The implementation lives in src/bots/ — see manager.ts, discord/, telegram/,
// and the shared vouch-service.ts.
//
// Load .env first: unlike the Next.js app, this standalone process does not get
// env files loaded automatically, and it needs TOKEN_ENCRYPTION_KEY (plus
// DATABASE_URL etc.) to decrypt stored bot tokens. dotenv does not override vars
// already present in the environment (e.g. those PM2 injected).
import "dotenv/config"
import { BotManager } from "./bots/manager"

const manager = new BotManager()
manager.start()
