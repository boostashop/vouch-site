// Entry point for the bot process (PM2 runs `tsx src/bot-manager.ts`).
// The implementation lives in src/bots/ — see manager.ts, discord/, telegram/,
// and the shared vouch-service.ts.
import { BotManager } from "./bots/manager"

const manager = new BotManager()
manager.start()
