import { Client, EmbedBuilder } from "discord.js"
import { Telegraf } from "telegraf"
import { prisma } from "./prisma"
import { spawnDiscordBot } from "./discord"
import { spawnTelegramBot } from "./telegram"
import { hasActivePremium } from "./vouch-service"
import { tryDecryptSecret } from "../lib/crypto"

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
  private telegramBots: Map<string, { bot: Telegraf<any>; token: string }> = new Map()
  private failedSpawns: Map<string, { token: string; at: number }> = new Map()

  async start() {
    console.log("Starting Bot Manager Service...")

    // Initial sync
    await this.syncBots()

    // Poll for new tokens every 60 seconds (or use a DB trigger/event in a real prod env)
    const interval = setInterval(() => this.syncBots(), 60000)

    // Check every hour for weekly summary sending time
    const summaryInterval = setInterval(() => this.sendWeeklySummaries(), 3600000)

    // Enable graceful stop
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down Bot Manager...`)
      clearInterval(interval)
      clearInterval(summaryInterval)

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
    // Include users still flagged online (or with a token): a user who removed
    // BOTH tokens would otherwise drop out of this query, leaving their client
    // running and their status stuck "online". Including the online flags lets
    // the teardown + status-reset below run for them too.
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { discordBotToken: { not: null } },
          { telegramBotToken: { not: null } },
          { discordBotOnline: true },
          { telegramBotOnline: true },
        ],
      },
    })

    for (const user of users) {
      // Tokens are stored encrypted at rest; decrypt to the plaintext the bot
      // libraries (and our change-detection below) expect. A token that fails to
      // decrypt is treated as absent so one bad row can't crash the sync loop.
      const discordToken = tryDecryptSecret(user.discordBotToken)
      const telegramToken = tryDecryptSecret(user.telegramBotToken)

      // --- Discord Sync ---
      const discordKey = `discord:${user.id}`
      const existingDiscord = this.discordClients.get(user.id)
      if (discordToken) {
        // Token replaced in the dashboard → tear down the stale client so we
        // respawn with the new one below.
        if (existingDiscord && existingDiscord.token !== discordToken) {
          console.log(`Discord token changed for ${user.id}; respawning.`)
          existingDiscord.client.destroy()
          this.discordClients.delete(user.id)
        }
        if (!this.discordClients.has(user.id) && this.shouldAttemptSpawn(discordKey, discordToken)) {
          const client = await spawnDiscordBot(user.id, discordToken)
          if (client) {
            this.discordClients.set(user.id, { client, token: discordToken })
            this.failedSpawns.delete(discordKey)
          } else {
            this.failedSpawns.set(discordKey, { token: discordToken, at: Date.now() })
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
      if (telegramToken) {
        if (existingTelegram && existingTelegram.token !== telegramToken) {
          console.log(`Telegram token changed for ${user.id}; respawning.`)
          existingTelegram.bot.stop("SIGTERM")
          this.telegramBots.delete(user.id)
        }
        if (!this.telegramBots.has(user.id) && this.shouldAttemptSpawn(telegramKey, telegramToken)) {
          const bot = await spawnTelegramBot(user.id, telegramToken)
          if (bot) {
            this.telegramBots.set(user.id, { bot, token: telegramToken })
            this.failedSpawns.delete(telegramKey)
          } else {
            this.failedSpawns.set(telegramKey, { token: telegramToken, at: Date.now() })
          }
        }
      } else if (existingTelegram) {
        console.log(`Stopping Telegram bot for ${user.id} (token removed)`)
        existingTelegram.bot.stop("SIGTERM")
        this.telegramBots.delete(user.id)
        this.failedSpawns.delete(telegramKey)
      }

      // Persist real bot health so the dashboard reflects spawn success/failure
      // (not just "a token exists"). Only write on a transition to avoid
      // hammering the DB every poll.
      const discordOnline = this.discordClients.has(user.id)
      const telegramOnline = this.telegramBots.has(user.id)
      if (discordOnline !== user.discordBotOnline || telegramOnline !== user.telegramBotOnline) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              discordBotOnline: discordOnline,
              telegramBotOnline: telegramOnline,
              botCheckedAt: new Date(),
            },
          })
        } catch (err) {
          console.error(`Failed to update bot status for ${user.id}:`, err)
        }
      }
    }
  }

  async sendWeeklySummaries() {
    const now = new Date()
    // Trigger weekly summary on Sunday at 18:00 (6 PM) local time
    if (now.getDay() !== 0 || now.getHours() !== 18) {
      return
    }

    console.log("Generating weekly reputation summaries for premium users...")
    const users = await prisma.user.findMany({
      where: {
        OR: [{ discordBotToken: { not: null } }, { telegramBotToken: { not: null } }],
      },
    })

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    for (const user of users) {
      const isPremium = hasActivePremium(user)
      if (!isPremium) continue // premium-gated

      try {
        // Fetch new vouches in last 7 days
        const newVouches = await prisma.vouch.findMany({
          where: {
            receiverId: user.id,
            status: "ACTIVE",
            createdAt: { gte: sevenDaysAgo },
          },
        })

        const totalVouches = await prisma.vouch.count({
          where: { receiverId: user.id, status: "ACTIVE" },
        })

        const newCount = newVouches.length
        const newAverage = newCount > 0
          ? (newVouches.reduce((acc, v) => acc + v.rating, 0) / newCount).toFixed(1)
          : "0.0"

        const summaryTitle = "📊 Your Weekly Reputation Summary"
        const summaryDesc = `Here is your Vouched.to performance overview for the past 7 days:\n\n` +
          `• **New Reviews:** \`${newCount}\`\n` +
          `• **Weekly Avg Rating:** \`⭐ ${newAverage} / 5.0\`\n` +
          `• **Total Reviews Overall:** \`${totalVouches}\`\n\n` +
          `Keep up the great work! 🚀`

        // Send via Discord DM if possible
        if (user.discordId) {
          const discordClientInfo = this.discordClients.get(user.id)
          if (discordClientInfo) {
            try {
              const ownerUser = await discordClientInfo.client.users.fetch(user.discordId)
              if (ownerUser) {
                const embed = new EmbedBuilder()
                  .setTitle(summaryTitle)
                  .setColor("#10B981")
                  .setDescription(summaryDesc)
                  .setFooter({ text: "Vouched.to • Weekly Summary" })
                  .setTimestamp()
                await ownerUser.send({ embeds: [embed] })
              }
            } catch (err) {
              console.error(`Failed to send weekly summary Discord DM to ${user.id}:`, err)
            }
          }
        }

        // Send via Telegram message if possible
        if (user.telegramId) {
          const telegramBotInfo = this.telegramBots.get(user.id)
          if (telegramBotInfo) {
            try {
              const text = `📊 *${summaryTitle}*\n\n${summaryDesc.replace(/• \*\*/g, '• *').replace(/\*\*/g, '*')}`
              await telegramBotInfo.bot.telegram.sendMessage(user.telegramId, text, { parse_mode: "Markdown" })
            } catch (err) {
              console.error(`Failed to send weekly summary Telegram message to ${user.id}:`, err)
            }
          }
        }
      } catch (err) {
        console.error(`Failed to process weekly summary for user ${user.id}:`, err)
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
