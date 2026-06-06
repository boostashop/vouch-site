import { Telegraf, Scenes, session } from "telegraf"
import { prisma } from "../prisma"
import {
  hasActivePremium,
  persistProofToR2,
  getLeaderboardRank,
  proofKey,
  FREE_VOUCH_LIMIT,
  validateVouchRules,
  addToBlacklist,
  removeFromBlacklist,
  reportVouch,
  getPendingReports,
  approveVouch,
  removeVouch,
  isMilestone,
  getActiveConfig,
} from "../vouch-service"
import { getSignedProofUrl } from "../../lib/proof-url"

const TELEGRAM_COMMANDS = [
  { command: "vouch", description: "Leave a vouch: /vouch <1-5> <comment>" },
  { command: "stats", description: "View vouch statistics" },
  { command: "badge", description: "Get your embeddable reputation badge (owner only, Premium)" },
  { command: "report", description: "Report a vouch: /report <vouch_id> [reason]" },
  { command: "blacklist", description: "Manage blacklist: /blacklist <add|remove> <user_id> [reason] (owner only)" },
  { command: "moderate", description: "Moderate vouches: /moderate <list|approve|remove> [vouch_id] (owner only)" },
  { command: "restore", description: "Re-post all vouches (owner only)" },
  { command: "config", description: "Configure settings: /config <key> <val> (owner only)" },
  { command: "remove", description: "Soft-delete a specific vouch: /remove <vouch_id> (owner only)" },
  { command: "export", description: "Export vouch data as JSON: /export (owner only, Premium)" },
  { command: "link", description: "Link this account to your dashboard" },
  { command: "help", description: "How to use this bot" },
]

const HELP_TEXT =
  "🤖 *Vouched.to Bot*\n\n" +
  "*/vouch <rating 1-5> <comment>* — leave a vouch. Attach a photo with that caption to include proof.\n" +
  "*/stats* — view vouch count, average score, and leaderboard rank.\n" +
  "*/badge* — owner only (Premium): get a live, embeddable reputation badge for forums & sites.\n" +
  "*/report <vouch_id> [reason]* — report a vouch to the seller for moderation.\n" +
  "*/blacklist <add|remove> <user_id> [reason]* — owner only: manage blacklist.\n" +
  "*/moderate <list|approve|remove> [vouch_id]* — owner only: moderate flagged/reported vouches.\n" +
  "*/restore* — owner only: re-post your full vouch history here.\n" +
  "*/config <channel|require_proof|min_account_age> <value>* — owner only: configure settings.\n" +
  "*/remove <vouch_id>* — owner only: soft-delete a specific vouch.\n" +
  "*/export* — owner only: export all vouch data as JSON (Premium).\n" +
  "*/link* — link this Telegram account to your dashboard.\n\n" +
  "_Powered by Vouched.to_"

interface BotContext extends Scenes.WizardContext {}

const vouchWizard = new Scenes.WizardScene<BotContext>(
  "vouch-wizard",
  async (ctx) => {
    const state = ctx.wizard.state as any
    state.receiverId = (ctx.scene.state as any).receiverId
    await ctx.reply("⭐ *Leave a Vouch*\n\nPlease select a rating from 1 to 5:", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "1 ⭐", callback_data: "rate_1" },
            { text: "2 ⭐", callback_data: "rate_2" },
            { text: "3 ⭐", callback_data: "rate_3" },
            { text: "4 ⭐", callback_data: "rate_4" },
            { text: "5 ⭐", callback_data: "rate_5" },
          ],
        ],
      },
    })
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data
      if (data.startsWith("rate_")) {
        const rating = parseInt(data.split("_")[1])
        const state = ctx.wizard.state as any
        state.rating = rating
        await ctx.answerCbQuery()
        await ctx.reply(`You chose *${rating} ⭐*.\n\nNow, please send your vouch comment/feedback (minimum 4 characters):`, {
          parse_mode: "Markdown",
        })
        return ctx.wizard.next()
      }
    }
    await ctx.reply("Please select a rating by tapping one of the stars above.")
  },
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : null
    if (!text || text.trim().length < 4) {
      await ctx.reply("❌ Feedback comment must be at least 4 characters long. Please send a valid comment:")
      return
    }
    const state = ctx.wizard.state as any
    state.comment = text
    await ctx.reply("Got it! Do you want to attach a photo as proof? Send the photo now, or tap the button below to skip proof.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Skip Proof", callback_data: "skip_proof" }],
        ],
      },
    })
    return ctx.wizard.next()
  },
  async (ctx) => {
    const state = ctx.wizard.state as any

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery && ctx.callbackQuery.data === "skip_proof") {
      await ctx.answerCbQuery()
      state.proofUrl = null
    } else if (ctx.message && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1]
      try {
        const fileLink = await ctx.telegram.getFileLink(photo.file_id)
        const key = proofKey("telegram", "jpg")
        const proofUrl = await persistProofToR2(fileLink.toString(), key, "image/jpeg")
        if (!proofUrl) {
          await ctx.reply("❌ Storage unavailable for proof. We will continue without proof.")
        }
        state.proofUrl = proofUrl
      } catch (err) {
        console.error("Error processing proof photo in wizard:", err)
        await ctx.reply("❌ Error downloading photo. We will continue without proof.")
        state.proofUrl = null
      }
    } else {
      await ctx.reply("Please upload a photo, or tap 'Skip Proof' to continue.")
      return
    }

    try {
      await validateVouchRules({
        receiverId: state.receiverId,
        giverId: ctx.from!.id.toString(),
        platform: "telegram",
        comment: state.comment,
        guildId: ctx.chat?.id.toString(),
      })
    } catch (err: any) {
      await ctx.reply(`❌ Validation failed: ${err.message}`)
      return ctx.scene.leave()
    }

    const stars = "⭐".repeat(state.rating)
    let previewText = `📝 *Vouch Preview*\n\n*Rating:* ${stars}\n*Comment:* ${state.comment}\n`
    if (state.proofUrl) {
      previewText += `*Proof:* Included 🖼️\n`
    } else {
      previewText += `*Proof:* None\n`
    }
    previewText += `\nDo you want to submit this vouch?`

    await ctx.reply(previewText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Confirm", callback_data: "confirm_vouch" },
            { text: "Cancel", callback_data: "cancel_vouch" },
          ],
        ],
      },
    })
    return ctx.wizard.next()
  },
  async (ctx) => {
    const state = ctx.wizard.state as any
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data
      await ctx.answerCbQuery()

      if (data === "confirm_vouch") {
        try {
          await validateVouchRules({
            receiverId: state.receiverId,
            giverId: ctx.from!.id.toString(),
            platform: "telegram",
            comment: state.comment,
            guildId: ctx.chat?.id.toString(),
          })

          const createdVouch = await prisma.vouch.create({
            data: {
              receiverId: state.receiverId,
              platform: "telegram",
              giverId: ctx.from!.id.toString(),
              giverName: ctx.from!.username || ctx.from!.first_name,
              sourceId: ctx.chat!.id.toString(),
              sourceName: (ctx.chat as any).title ?? null,
              rating: state.rating,
              comment: state.comment,
              proofImageUrl: state.proofUrl,
              createdAt: new Date(),
            },
          })

          const config = await getActiveConfig(state.receiverId, ctx.chat?.id.toString() || null)
          const baseUrl = process.env.AUTH_URL || "https://vouched.to"
          const permalink = config?.slug ? `${baseUrl}/u/${config.slug}#vouch-${createdVouch.id}` : null

          const stars = "⭐".repeat(state.rating)
          let responseText = `✅ *Vouch Recorded!*\n\n*Giver:* ${ctx.from!.first_name}\n*Rating:* ${stars}\n*Comment:* ${state.comment}`
          if (permalink) {
            responseText += `\n[🔗 Verify Vouch](${permalink})`
          }
          responseText += `\n\n_ID: ${createdVouch.id} • ${config?.vouchEmbedFooter || "Powered by Vouched.to"}_`

          const replyMarkup = permalink ? {
            inline_keyboard: [
              [{ text: "🌐 View Profile", url: `${baseUrl}/u/${config?.slug}` }]
            ]
          } : undefined

          await ctx.reply(responseText, { parse_mode: "Markdown", reply_markup: replyMarkup })

          // Owner DM
          if (config?.telegramId) {
            try {
              const dmText = `🔔 *New Vouch Received!*\n\nYou received a new vouch from *${ctx.from!.first_name}*!\n\n*Rating:* ${stars}\n*Comment:* ${state.comment}\n\n_ID: ${createdVouch.id}_`
              await ctx.telegram.sendMessage(config.telegramId, dmText, { parse_mode: "Markdown" })
            } catch (dmErr) {
              console.error("Failed to DM Telegram bot owner:", dmErr)
            }
          }

          // Milestone Announcement
          const totalVouches = await prisma.vouch.count({
            where: { receiverId: state.receiverId, status: "ACTIVE" },
          })
          if (isMilestone(totalVouches)) {
            const milestoneText = `🎉 *Vouch Milestone Reached!*\n\n🚀 *${config?.name || config?.username || "Seller"}* has reached *${totalVouches}* verified vouches!`
            await ctx.reply(milestoneText, { parse_mode: "Markdown" })
          }
        } catch (err: any) {
          await ctx.reply(`❌ Failed to record vouch: ${err.message}`)
        }
      } else {
        await ctx.reply("❌ Vouch cancelled.")
      }
      return ctx.scene.leave()
    }
    await ctx.reply("Please tap Confirm or Cancel.")
  }
)

vouchWizard.command("cancel", async (ctx) => {
  await ctx.reply("❌ Vouch wizard cancelled.")
  return ctx.scene.leave()
})

// Spawn a Telegram bot for a user's token. Returns the running bot, or null if
// the token is invalid (validated via getMe before launch).
export async function spawnTelegramBot(userId: string, token: string): Promise<Telegraf<BotContext> | null> {
  console.log(`Spawning Telegram bot for User ID: ${userId}`)

  const bot = new Telegraf<BotContext>(token)

  const stage = new Scenes.Stage<BotContext>([vouchWizard])
  bot.use(session())
  bot.use(stage.middleware())

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
    console.log(`[Telegram] Starting vouch wizard from /vouch command for User ${userId}`)
    await ctx.scene.enter("vouch-wizard", { receiverId: userId })
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
      const config = await getActiveConfig(userId, ctx.chat.id.toString())
      if (!config) return

      const totalVouches = await prisma.vouch.count({
        where: { receiverId: userId, status: "ACTIVE" },
      })

      if (!config.isPremium && totalVouches >= FREE_VOUCH_LIMIT) {
        return ctx.reply(`❌ Vouch limit (${FREE_VOUCH_LIMIT}) reached.`)
      }

      // Run validation rules
      try {
        await validateVouchRules({
          receiverId: userId,
          giverId: ctx.from.id.toString(),
          platform: "telegram",
          comment,
          guildId: ctx.chat.id.toString(),
        })
      } catch (validationErr: any) {
        return ctx.reply(`❌ ${validationErr.message}`)
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

      const createdVouch = await prisma.vouch.create({
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

      // Generate verification permalink
      const baseUrl = process.env.AUTH_URL || "https://vouched.to"
      const permalink = config.slug ? `${baseUrl}/u/${config.slug}#vouch-${createdVouch.id}` : null

      const stars = "⭐".repeat(rating)
      let responseText = `✅ **Vouch Recorded with Proof!**\n\n**Giver:** ${ctx.from.first_name}\n**Rating:** ${stars}\n**Comment:** ${comment}`
      if (permalink) {
        responseText += `\n[🔗 Verify Vouch](${permalink})`
      }
      responseText += `\n\n_ID: ${createdVouch.id} • ${config.vouchEmbedFooter}_`

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

  bot.command("badge", async (ctx) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const baseUrl = process.env.AUTH_URL || "https://vouched.to"

      if (!user) return ctx.reply("❌ User not found.")
      if (!hasActivePremium(user)) {
        return ctx.reply(
          `🔒 The embeddable reputation badge is a Premium feature.\nUpgrade at ${baseUrl}/dashboard to unlock it.`,
        )
      }
      if (!user.slug) {
        return ctx.reply("⚠️ Set a profile slug in your dashboard first to generate your badge.")
      }

      const profileUrl = `${baseUrl}/u/${user.slug}`
      const bannerUrl = `${baseUrl}/u/${user.slug}/badge`
      const chipUrl = `${baseUrl}/u/${user.slug}/badge?size=chip`
      const bbcode = `[url=${profileUrl}][img]${bannerUrl}[/img][/url]`

      const caption =
        "🏅 *Your Embeddable Vouch Badge*\n\n" +
        "A live image of your reputation — it updates automatically as you collect vouches.\n\n" +
        "*BBCode (forums):*\n" +
        "`" + bbcode + "`\n\n" +
        "*Direct image URLs:*\n" +
        `Banner: ${bannerUrl}\n` +
        `Compact: ${chipUrl}`

      await ctx.replyWithPhoto(
        { url: bannerUrl },
        {
          caption,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[{ text: "🌐 View Profile", url: profileUrl }]] },
        },
      )
    } catch (err) {
      console.error("Error building Telegram badge:", err)
      await ctx.reply("❌ Failed to build badge.")
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
          const signedUrl = getSignedProofUrl(vouch.proofImageUrl)
          if (signedUrl) {
            await ctx.replyWithPhoto(signedUrl, { caption: text, parse_mode: "Markdown" })
          } else {
            await ctx.reply(text, { parse_mode: "Markdown" })
          }
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

  bot.command("blacklist", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    const args = ctx.message.text.split(" ").slice(1)
    const subcommand = args[0]?.toLowerCase()
    const targetUserId = args[1]
    const reason = args.slice(2).join(" ") || null

    if (!subcommand || !["add", "remove"].includes(subcommand) || !targetUserId) {
      return ctx.reply(
        "❌ **Usage:**\n`/blacklist add <user_id> [reason]`\n`/blacklist remove <user_id>`",
        { parse_mode: "Markdown" }
      )
    }

    if (subcommand === "add") {
      await addToBlacklist({
        userId,
        platform: "telegram",
        blockedId: targetUserId,
        reason,
      })
      return ctx.reply(`✅ User with ID \`${targetUserId}\` has been blacklisted.`, { parse_mode: "Markdown" })
    } else {
      const success = await removeFromBlacklist({
        userId,
        platform: "telegram",
        blockedId: targetUserId,
      })
      if (success) {
        return ctx.reply(`✅ User with ID \`${targetUserId}\` has been removed from the blacklist.`, { parse_mode: "Markdown" })
      } else {
        return ctx.reply(`❌ User with ID \`${targetUserId}\` was not on the blacklist.`, { parse_mode: "Markdown" })
      }
    }
  })

  bot.command("report", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1)
    const vouchId = args[0]
    const reason = args.slice(1).join(" ") || null

    if (!vouchId) {
      return ctx.reply(
        "❌ **Usage:** `/report <vouch_id> [reason]`",
        { parse_mode: "Markdown" }
      )
    }

    try {
      await reportVouch({
        vouchId,
        reporterId: ctx.from.id.toString(),
        reason,
      })
      return ctx.reply(`⚠️ Vouch \`${vouchId}\` has been reported to the seller for moderation.`, { parse_mode: "Markdown" })
    } catch (err: any) {
      return ctx.reply(`❌ Error: ${err.message}`)
    }
  })

  bot.command("moderate", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    const args = ctx.message.text.split(" ").slice(1)
    const subcommand = args[0]?.toLowerCase()
    const vouchId = args[1]

    if (!subcommand || !["list", "approve", "remove"].includes(subcommand)) {
      return ctx.reply(
        "❌ **Usage:**\n`/moderate list`\n`/moderate approve <vouch_id>`\n`/moderate remove <vouch_id>`",
        { parse_mode: "Markdown" }
      )
    }

    if (subcommand === "list") {
      const reports = await getPendingReports(userId)
      if (reports.length === 0) {
        return ctx.reply("✅ No pending reports in your moderation queue.")
      }

      let text = "⚠️ **Pending Vouch Moderation Queue**\n\nThe following vouches have been flagged. Use `/moderate approve <vouch_id>` or `/moderate remove <vouch_id>` to resolve them.\n\n"
      reports.slice(0, 10).forEach((v, index) => {
        text += `**Report #${index + 1}**\n**ID:** \`${v.id}\`\n**Giver:** ${v.giverName} (${v.giverId})\n**Rating:** ${"⭐".repeat(v.rating)}\n**Comment:** ${v.comment || "No comment"}\n**Date:** ${v.createdAt.toLocaleDateString()}\n\n`
      })

      if (reports.length > 10) {
        text += `_Showing first 10 of ${reports.length} pending reports._`
      }

      return ctx.reply(text, { parse_mode: "Markdown" })
    }

    if (!vouchId) {
      return ctx.reply(`❌ Please specify a vouch ID: \`/moderate ${subcommand} <vouch_id>\``, { parse_mode: "Markdown" })
    }

    if (subcommand === "approve") {
      try {
        await approveVouch(userId, vouchId)
        return ctx.reply(`✅ Vouch \`${vouchId}\` has been approved and marked active.`, { parse_mode: "Markdown" })
      } catch (err: any) {
        return ctx.reply(`❌ Error: ${err.message}`)
      }
    }

    if (subcommand === "remove") {
      try {
        await removeVouch(userId, vouchId)
        return ctx.reply(`✅ Vouch \`${vouchId}\` has been soft-deleted and removed from public profile.`, { parse_mode: "Markdown" })
      } catch (err: any) {
        return ctx.reply(`❌ Error: ${err.message}`)
      }
    }
  })

  bot.command("profile", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1)
    let targetId = userId
    if (args[0]) {
      const inputUsername = args[0].replace("@", "").trim()
      const u = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: inputUsername, mode: "insensitive" } },
            { slug: { equals: inputUsername, mode: "insensitive" } },
          ]
        }
      })
      if (!u) {
        return ctx.reply("❌ User profile not found on Vouched.to.")
      }
      targetId = u.id
    }

    try {
      const profileUser = await prisma.user.findUnique({
        where: { id: targetId },
        include: {
          _count: { select: { vouchesReceived: true } },
          vouchesReceived: { select: { rating: true } },
        }
      })
      if (!profileUser) return ctx.reply("❌ Profile not found.")

      const count = profileUser._count.vouchesReceived
      const totalRating = profileUser.vouchesReceived.reduce((acc, v) => acc + v.rating, 0)
      const averageRating = count > 0 ? (totalRating / count).toFixed(1) : "0.0"
      const rank = await getLeaderboardRank(count)

      const text =
        `👤 *${profileUser.name || profileUser.username || "Seller"}'s Profile*\n\n` +
        `*Score:* ⭐ ${averageRating} / 5.0\n` +
        `*Total Reviews:* 📝 ${count}\n` +
        `*Leaderboard Rank:* 🏆 ${rank > 0 ? `#${rank}` : "Unranked"}\n\n` +
        `_${profileUser.profileMetaDescription || "Check out my verified reputation!"}_`

      const baseUrl = process.env.AUTH_URL || "https://vouched.to"
      const replyMarkup = profileUser.slug ? {
        inline_keyboard: [
          [{ text: "🌐 View Full Profile", url: `${baseUrl}/u/${profileUser.slug}` }]
        ]
      } : undefined

      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: replyMarkup })
    } catch (err) {
      console.error(err)
      await ctx.reply("❌ Error fetching profile.")
    }
  })

  bot.command("leaderboard", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1)
    const scope = args[0]?.toLowerCase() === "server" ? "server" : "global"
    let topSellers = []

    try {
      if (scope === "server" && ctx.chat) {
        topSellers = await prisma.vouch.groupBy({
          by: ['receiverId'],
          where: {
            sourceId: ctx.chat.id.toString(),
            status: "ACTIVE"
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        })
      } else {
        topSellers = await prisma.vouch.groupBy({
          by: ['receiverId'],
          where: { status: "ACTIVE" },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        })
      }

      if (topSellers.length === 0) {
        return ctx.reply("ℹ️ No vouches recorded yet.")
      }

      let text = `🏆 *${scope === "server" ? "Group" : "Global"} Leaderboard*\n\nTop sellers ranked by verified vouch count:\n\n`

      for (let i = 0; i < topSellers.length; i++) {
        const sellerId = topSellers[i].receiverId
        const sellerCount = topSellers[i]._count.id
        const sellerUser = await prisma.user.findUnique({ where: { id: sellerId } })
        if (sellerUser) {
          const name = sellerUser.name || sellerUser.username || "Anonymous Seller"
          const baseUrl = process.env.AUTH_URL || "https://vouched.to"
          text += `*#${i + 1} - ${name}*\nTotal Vouches: *${sellerCount}* ${sellerUser.slug ? `| [Profile](${baseUrl}/u/${sellerUser.slug})` : ""}\n\n`
        }
      }

      await ctx.reply(text, { parse_mode: "Markdown" })
    } catch (err) {
      console.error(err)
      await ctx.reply("❌ Error fetching leaderboard.")
    }
  })

  bot.command("recent", async (ctx) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return ctx.reply("❌ Profile not found.")

      const recentVouches = await prisma.vouch.findMany({
        where: { receiverId: userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 3
      })

      if (recentVouches.length === 0) {
        return ctx.reply("ℹ️ No vouches recorded for this profile yet.")
      }

      let text = `🕒 *Recent Vouches for ${user.name || user.username || "Seller"}*\n\n`
      recentVouches.forEach((v, index) => {
        text += `*Vouch #${index + 1} from ${v.giverName}* (${"⭐".repeat(v.rating)})\n` +
                `_"${v.comment || "No comment"}"_\n`
        if (v.sellerReply) {
          text += `↳ *Response:* _"${v.sellerReply}"_\n`
        }
        text += `_Date: ${v.createdAt.toLocaleDateString()}_\n\n`
      })

      await ctx.reply(text, { parse_mode: "Markdown" })
    } catch (err) {
      console.error(err)
      await ctx.reply("❌ Error fetching recent vouches.")
    }
  })

  bot.command("config", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    const guildId = ctx.chat.id.toString()
    const args = ctx.message.text.split(" ").slice(1)
    const key = args[0]?.toLowerCase()
    const val = args[1]?.toLowerCase()

    if (!key || !["channel", "require_proof", "min_account_age"].includes(key)) {
      return ctx.reply(
        "❌ **Usage:**\n" +
        "`/config channel <channel_id>`\n" +
        "`/config require_proof <true|false>`\n" +
        "`/config min_account_age <days>`\n\n" +
        "Type `/config` in the group/channel you want to configure.",
        { parse_mode: "Markdown" }
      )
    }

    if (val === undefined) {
      return ctx.reply(`❌ Please provide a value for \`${key}\`.`, { parse_mode: "Markdown" })
    }

    const existing = await prisma.guildConfig.findUnique({
      where: { userId_guildId: { userId, guildId } },
    })

    let data: any = {}
    if (key === "channel") {
      data.vouchChannelId = val === "none" || val === "null" ? null : val
    } else if (key === "require_proof") {
      data.requireProof = val === "true" || val === "yes" || val === "1"
    } else if (key === "min_account_age") {
      const days = parseInt(val)
      if (isNaN(days) || days < 0) {
        return ctx.reply("❌ min_account_age must be a non-negative integer.")
      }
      data.minAccountAgeDays = days
    }

    const updated = await prisma.guildConfig.upsert({
      where: { userId_guildId: { userId, guildId } },
      create: {
        userId,
        guildId,
        vouchChannelId: key === "channel" ? data.vouchChannelId : null,
        requireProof: key === "require_proof" ? data.requireProof : false,
        minAccountAgeDays: key === "min_account_age" ? data.minAccountAgeDays : 0,
      },
      update: data,
    })

    return ctx.reply(
      `✅ **Server Configuration Updated!**\n\n` +
      `• **Announcement Channel/Chat ID:** \`${updated.vouchChannelId || "None"}\`\n` +
      `• **Require Proof:** \`${updated.requireProof}\`\n` +
      `• **Min Account Age:** \`${updated.minAccountAgeDays} days\``,
      { parse_mode: "Markdown" }
    )
  })

  bot.command("remove", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    const args = ctx.message.text.split(" ").slice(1)
    const vouchId = args[0]
    if (!vouchId) {
      return ctx.reply("❌ **Usage:** `/remove <vouch_id>`", { parse_mode: "Markdown" })
    }

    try {
      await removeVouch(userId, vouchId)
      return ctx.reply(`✅ Vouch \`${vouchId}\` has been soft-deleted and removed from public profile.`)
    } catch (err: any) {
      return ctx.reply(`❌ Error: ${err.message}`)
    }
  })

  bot.command("export", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    const config = await getActiveConfig(userId, ctx.chat.id.toString())
    if (!config || !config.isPremium) {
      return ctx.reply("❌ This command is premium-gated. Upgrade to Premium to export your vouch data.")
    }

    try {
      const vouches = await prisma.vouch.findMany({
        where: { receiverId: userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      })

      const jsonContent = JSON.stringify(vouches, null, 2)
      const buffer = Buffer.from(jsonContent, "utf-8")

      await ctx.telegram.sendDocument(ctx.from.id, {
        source: buffer,
        filename: `vouches_export_${userId}.json`,
      }, {
        caption: `📊 Here is your Vouched.to data export. It contains ${vouches.length} active vouches.`,
      })

      return ctx.reply("✅ Your data has been exported and sent to your DMs!")
    } catch (err) {
      console.error("Failed to export Telegram vouches:", err)
      return ctx.reply("❌ Failed to export vouch data.")
    }
  })

  bot.command("reply", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    const args = ctx.message.text.split(" ").slice(1)
    const vouchId = args[0]
    const response = args.slice(1).join(" ")

    if (!vouchId || !response) {
      return ctx.reply("❌ **Usage:** `/reply <vouch_id> <your reply text>`", { parse_mode: "Markdown" })
    }

    try {
      const vouch = await prisma.vouch.findUnique({
        where: { id: vouchId },
      })

      if (!vouch || vouch.receiverId !== userId) {
        return ctx.reply("❌ Vouch not found or unauthorized.")
      }

      await prisma.vouch.update({
        where: { id: vouchId },
        data: { sellerReply: response },
      })

      return ctx.reply(`✅ Successfully replied to vouch \`${vouchId}\`!\n\n**Reply:** "${response}"`)
    } catch (err: any) {
      return ctx.reply(`❌ Error: ${err.message}`)
    }
  })

  bot.command("import", async (ctx) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.telegramId !== ctx.from.id.toString()) {
      return ctx.reply("❌ Only the owner can use this command.")
    }

    return ctx.reply(
      "❌ **Telegram Bot API Limitation:** Standard bots cannot fetch chat history. " +
      "To import existing vouches on Telegram, please contact support or use the web importer."
    )
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
