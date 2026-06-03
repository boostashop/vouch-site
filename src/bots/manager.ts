import { Client } from "discord.js"
import { Telegraf } from "telegraf"
import { prisma } from "./prisma"
import { spawnDiscordBot } from "./discord"
import { spawnTelegramBot } from "./telegram"

// After a spawn fails for a given token, wait this long before retrying that
// same token — otherwise a bad/revoked token gets retried every poll (60s) and
// can get the IP rate-limited or banned by Discord/Telegram. A token change
// bypasses the backoff immediately.
const SPAWN_RETRY_BACKOFF_MS = 5 * 60 * 1000

// Multi-tenant manager. Owns the live bot instances and the DB sync loop; the
// per-platform modules own the actual command/interaction logic. We remember the
// token each client was spawned with so we can detect dashboard edits and
// respawn with the new token.
export class BotManager {
  private discordClients: Map<string, { client: Client; token: string }> = new Map()
  private telegramBots: Map<string, { bot: Telegraf; token: string }> = new Map()
  private failedSpawns: Map<string, { token: string; at: number }> = new Map()

  async start() {
    console.log("Starting Bot Manager Service...")

    // Initial sync
    await this.syncBots()

    // Poll for new tokens every 60 seconds (or use a DB trigger/event in a real prod env)
    const interval = setInterval(() => this.syncBots(), 60000)

    // Enable graceful stop
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down Bot Manager...`)
      clearInterval(interval)

      for (const [userId, { client }] of this.discordClients) {
        console.log(`Destroying Discord client for ${userId}`)
        client.destroy()
      }

      for (const [userId, { bot }] of this.telegramBots) {
        console.log(`Stopping Telegram bot for ${userId}`)
        bot.stop(signal)
      }

      process.exit(0)
    }

    process.once("SIGINT", () => shutdown("SIGINT"))
    process.once("SIGTERM", () => shutdown("SIGTERM"))
  }

  async syncBots() {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ discordBotToken: { not: null } }, { telegramBotToken: { not: null } }],
      },
    })

    for (const user of users) {
      // --- Discord Sync ---
      const discordKey = `discord:${user.id}`
      const existingDiscord = this.discordClients.get(user.id)
      if (user.discordBotToken) {
        // Token replaced in the dashboard → tear down the stale client so we
        // respawn with the new one below.
        if (existingDiscord && existingDiscord.token !== user.discordBotToken) {
          console.log(`Discord token changed for ${user.id}; respawning.`)
          existingDiscord.client.destroy()
          this.discordClients.delete(user.id)
        }
        if (!this.discordClients.has(user.id) && this.shouldAttemptSpawn(discordKey, user.discordBotToken)) {
          const client = await spawnDiscordBot(user.id, user.discordBotToken)
          if (client) {
            this.discordClients.set(user.id, { client, token: user.discordBotToken })
            this.failedSpawns.delete(discordKey)
          } else {
            this.failedSpawns.set(discordKey, { token: user.discordBotToken, at: Date.now() })
          }
        }
      } else if (existingDiscord) {
        console.log(`Stopping Discord bot for ${user.id} (token removed)`)
        existingDiscord.client.destroy()
        this.discordClients.delete(user.id)
        this.failedSpawns.delete(discordKey)
      }

      // --- Telegram Sync ---
      const telegramKey = `telegram:${user.id}`
      const existingTelegram = this.telegramBots.get(user.id)
      if (user.telegramBotToken) {
        if (existingTelegram && existingTelegram.token !== user.telegramBotToken) {
          console.log(`Telegram token changed for ${user.id}; respawning.`)
          existingTelegram.bot.stop("SIGTERM")
          this.telegramBots.delete(user.id)
        }
        if (!this.telegramBots.has(user.id) && this.shouldAttemptSpawn(telegramKey, user.telegramBotToken)) {
          const bot = await spawnTelegramBot(user.id, user.telegramBotToken)
          if (bot) {
            this.telegramBots.set(user.id, { bot, token: user.telegramBotToken })
            this.failedSpawns.delete(telegramKey)
          } else {
            this.failedSpawns.set(telegramKey, { token: user.telegramBotToken, at: Date.now() })
          }
        }
      } else if (existingTelegram) {
        console.log(`Stopping Telegram bot for ${user.id} (token removed)`)
        existingTelegram.bot.stop("SIGTERM")
        this.telegramBots.delete(user.id)
        this.failedSpawns.delete(telegramKey)
      }
    }
  }

  // Skip respawning a token that just failed, unless the token has since changed
  // or the backoff window has elapsed — prevents hammering Discord/Telegram with
  // a known-bad token on every poll.
  private shouldAttemptSpawn(key: string, token: string): boolean {
    const failed = this.failedSpawns.get(key)
    if (!failed) return true
    if (failed.token !== token) return true
    return Date.now() - failed.at > SPAWN_RETRY_BACKOFF_MS
  }
}
