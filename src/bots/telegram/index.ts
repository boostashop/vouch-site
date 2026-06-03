import { Telegraf } from "telegraf"
import { prisma } from "../prisma"
import {
  hasActivePremium,
  persistProofToR2,
  getLeaderboardRank,
  proofKey,
  FREE_VOUCH_LIMIT,
} from "../vouch-service"

const TELEGRAM_COMMANDS = [
  { command: "vouch", description: "Leave a vouch: /vouch <1-5> <comment>" },
  { command: "stats", description: "View vouch statistics" },
  { command: "restore", description: "Re-post all vouches (owner only)" },
  { command: "link", description: "Link this account to your dashboard" },
  { command: "help", description: "How to use this bot" },
]

const HELP_TEXT =
  "🤖 *Vouched.to Bot*\n\n" +
  "*/vouch <rating 1-5> <comment>* — leave a vouch. Attach a photo with that caption to include proof.\n" +
  "*/stats* — view vouch count, average score, and leaderboard rank.\n" +
  "*/restore* — owner only: re-post your full vouch history here.\n" +
  "*/link* — link this Telegram account to your dashboard.\n\n" +
  "_Powered by Vouched.to_"

// Spawn a Telegram bot for a user's token. Returns the running bot, or null if
// the token is invalid (validated via getMe before launch).
export async function spawnTelegramBot(userId: string, token: string): Promise<Telegraf | null> {
  console.log(`Spawning Telegram bot for User ID: ${userId}`)

  const bot = new Telegraf(token)

  bot.command(["start", "link"], async (ctx) => {
    console.log(`[Telegram] Received /start or /link from ${ctx.from.id} for User ${userId}`)
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { telegramId: ctx.from.id.toString() },
      })
      console.log(`[Telegram] Successfully linked ID ${ctx.from.id} to User ${userId}`)
      await ctx.reply(
        "🚀 **Vouched.to Bot is linked!**\n\nYour Telegram account is now connected to your dashboard. You can use /vouch <rating> <comment> to collect feedback and /restore to re-post your vouches.",
        { parse_mode: "Markdown" },
      )
    } catch (err) {
      console.error(`[Telegram] Failed to link ID ${ctx.from.id} to User ${userId}:`, err)
      await ctx.reply("❌ Failed to link your account. Please try again.")
    }
  })

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" })
  })

  bot.command("vouch", async (ctx) => {
    console.log(`[Telegram] Received /vouch from ${ctx.from.id} for User ${userId}`)
    const args = ctx.message.text.split(" ").slice(1)
    const rating = parseInt(args[0])
    const comment = args.slice(1).join(" ")

    if (isNaN(rating) || rating < 1 || rating > 5 || !comment) {
      return ctx.reply(
        "❌ **Usage:** `/vouch <rating:1-5> <comment>`\nExample: `/vouch 5 Great service!`",
        { parse_mode: "Markdown" },
      )
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { _count: { select: { vouchesReceived: true } } },
      })

      if (!user) return ctx.reply("❌ User not found.")

      if (!hasActivePremium(user) && user._count.vouchesReceived >= FREE_VOUCH_LIMIT) {
        return ctx.reply(
          `❌ Vouch limit (${FREE_VOUCH_LIMIT}) reached for this account. Upgrade to Premium for unlimited storage.`,
        )
      }

      if (user.vouchRequireProof) {
        return ctx.reply(
          "❌ This user requires proof. Please send a photo with the caption: `/vouch " +
            rating +
            " " +
            comment +
            "`",
        )
      }

      await prisma.vouch.create({
        data: {
          receiverId: userId,
          platform: "telegram",
          giverId: ctx.from.id.toString(),
          giverName: ctx.from.username || ctx.from.first_name,
          sourceId: ctx.chat.id.toString(),
          sourceName: (ctx.chat as any).title ?? null,
          rating,
          comment,
          createdAt: new Date(),
        },
      })

      const stars = "⭐".repeat(rating)
      const responseText = `✅ **Vouch Recorded!**\n\n**Giver:** ${ctx.from.first_name}\n**Rating:** ${stars}\n**Comment:** ${comment}\n\n_${user.vouchEmbedFooter}_`

      await ctx.reply(responseText, { parse_mode: "Markdown" })
    } catch (err) {
      console.error("Error saving Telegram vouch:", err)
      await ctx.reply("❌ Failed to save vouch.")
    }
  })

  // Handle photos sent with /vouch caption
  bot.on("photo", async (ctx) => {
    const caption = (ctx.message as any).caption
    if (!caption || !caption.startsWith("/vouch")) return

    const args = caption.split(" ").slice(1)
    const rating = parseInt(args[0])
    const comment = args.slice(1).join(" ")

    if (isNaN(rating) || rating < 1 || rating > 5 || !comment) {
      return ctx.reply(
        "❌ **Invalid Format.** Use: `/vouch <rating:1-5> <comment>` as the caption for your photo.",
        { parse_mode: "Markdown" },
      )
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { _count: { select: { vouchesReceived: true } } },
      })

      if (!user) return

      if (!hasActivePremium(user) && user._count.vouchesReceived >= FREE_VOUCH_LIMIT) {
        return ctx.reply(`❌ Vouch limit (${FREE_VOUCH_LIMIT}) reached.`)
      }

      const photo = ctx.message.photo[ctx.message.photo.length - 1]
      const fileLink = await ctx.telegram.getFileLink(photo.file_id)
      const key = proofKey("telegram", "jpg")
      const proofUrl = await persistProofToR2(fileLink.toString(), key, "image/jpeg")

      // The photo IS the proof here, so if we can't store it, don't save a
      // "with proof" vouch — and never persist the Telegram link (it embeds
      // the bot token).
      if (!proofUrl) {
        return ctx.reply(
          "❌ Could not save your proof image right now (storage unavailable). Please try again later.",
        )
      }

      await prisma.vouch.create({
        data: {
          receiverId: userId,
          platform: "telegram",
          giverId: ctx.from.id.toString(),
          giverName: ctx.from.username || ctx.from.first_name,
          sourceId: ctx.chat.id.toString(),
          sourceName: (ctx.chat as any).title ?? null,
          rating,
          comment,
          proofImageUrl: proofUrl,
          createdAt: new Date(),
        },
      })

      const stars = "⭐".repeat(rating)
      const responseText = `✅ **Vouch Recorded with Proof!**\n\n**Giver:** ${ctx.from.first_name}\n**Rating:** ${stars}\n**Comment:** ${comment}\n\n_${user.vouchEmbedFooter}_`

      await ctx.reply(responseText, { parse_mode: "Markdown" })
    } catch (err) {
      console.error("Error saving Telegram photo vouch:", err)
      await ctx.reply("❌ Failed to save vouch with proof.")
    }
  })

  bot.command("stats", async (ctx) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: { select: { vouchesReceived: true } },
          vouchesReceived: { select: { rating: true } },
        },
      })

      if (!user) return ctx.reply("❌ User not found.")

      const count = user._count.vouchesReceived
      const totalRating = user.vouchesReceived.reduce((acc, v) => acc + v.rating, 0)
      const averageRating = count > 0 ? (totalRating / count).toFixed(1) : "0.0"

      const rank = user.statsShowLeaderboard ? await getLeaderboardRank(count) : 0
      const rankText = rank > 0 ? `#${rank}` : "Unranked"

      const statsText =
        `📊 **${user.statsEmbedTitle}**\n\n` +
        `${user.statsEmbedDescription}\n\n` +
        (user.statsShowCount ? `**Total Vouches:** ${count}\n` : "") +
        (user.statsShowScore ? `**Average Rating:** ${averageRating} / 5.0\n` : "") +
        (user.statsShowLeaderboard ? `**Leaderboard:** ${rankText}\n` : "") +
        (user.statsShowPlan ? `**Account Plan:** ${hasActivePremium(user) ? "Premium" : "Free"}\n` : "") +
        (user.statsShowExpiration && user.premiumExpiresAt
          ? `**Renews/Expires:** ${user.premiumExpiresAt.toLocaleDateString()}\n`
          : "") +
        `\n_${user.statsEmbedFooter}_`

      await ctx.reply(statsText, { parse_mode: "Markdown" })
    } catch (err) {
      console.error("Error fetching Telegram stats:", err)
      await ctx.reply("❌ Failed to fetch stats.")
    }
  })

  bot.command("restore", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    await ctx.reply("⏳ **Starting restoration...** re-posting all vouches.", { parse_mode: "Markdown" })

    const vouches = await prisma.vouch.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "asc" },
    })

    for (const vouch of vouches) {
      const stars = "⭐".repeat(vouch.rating)
      const text = `**Vouch from ${vouch.giverName}**\nRating: ${stars}\nComment: ${vouch.comment}`

      try {
        if (vouch.proofImageUrl) {
          await ctx.replyWithPhoto(vouch.proofImageUrl, { caption: text, parse_mode: "Markdown" })
        } else {
          await ctx.reply(text, { parse_mode: "Markdown" })
        }
      } catch (err) {
        console.error("Failed to restore Telegram vouch:", err)
      }
      // Slightly faster delay for Telegram
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    await ctx.reply("✅ **Restoration complete!**")
  })

  // Validate the token before committing — getMe throws on a bad/revoked
  // token, which lets us report failure (and back off) instead of leaking an
  // unhandled promise rejection from launch().
  try {
    await bot.telegram.getMe()
  } catch (error) {
    console.error(`Failed to start Telegram bot for ${userId}:`, error)
    return null
  }

  // Register the command menu so they autocomplete in the Telegram UI.
  try {
    await bot.telegram.setMyCommands(TELEGRAM_COMMANDS)
  } catch (err) {
    console.error(`Failed to set Telegram commands for ${userId}:`, err)
  }

  // launch() resolves only when the bot stops, so we don't await it; we just
  // catch a later crash so it doesn't become an unhandled rejection.
  bot.launch().catch((err) => console.error(`Telegram bot for ${userId} stopped:`, err))
  console.log(`Telegram Bot for ${userId} is online.`)
  return bot
}
