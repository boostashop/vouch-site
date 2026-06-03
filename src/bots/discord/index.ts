import {
  Client,
  GatewayIntentBits,
  Options,
  EmbedBuilder,
  ChatInputCommandInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  ButtonInteraction,
} from "discord.js"
import { v4 as uuidv4 } from "uuid"
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
} from "../vouch-service"
import { registerDiscordCommands } from "./commands"

// In-memory cache for pending modal/button vouches to support preview/confirmation
const pendingDiscordVouches = new Map<string, { receiverId: string; rating: number; comment: string }>()

// Spawn a Discord client for a user's bot token. Returns the logged-in client,
// or null if login failed (so the manager can back off). The manager owns the
// client map; this module owns command registration + interaction handling.
export async function spawnDiscordBot(userId: string, token: string): Promise<Client | null> {
  console.log(`Spawning Discord bot for User ID: ${userId}`)

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    // Optimization: Limit cache to keep RAM usage low
    makeCache: Options.cacheWithLimits({
      MessageManager: 0,
      PresenceManager: 0,
      ThreadManager: 0,
      ReactionManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
    }),
  })

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      console.log(
        `[Interaction] Received command ${interaction.commandName} (ID: ${interaction.id}) from ${interaction.user.tag} for User ${userId}`,
      )
      await handleDiscordInteraction(interaction, userId)
    } else if (interaction.isButton()) {
      console.log(
        `[Interaction] Received button click ${interaction.customId} from ${interaction.user.tag} for User ${userId}`,
      )
      await handleDiscordButton(interaction, userId)
    } else if (interaction.isModalSubmit()) {
      console.log(
        `[Interaction] Received modal submit ${interaction.customId} from ${interaction.user.tag} for User ${userId}`,
      )
      await handleDiscordModalSubmit(interaction, userId)
    }
  })

  try {
    await client.login(token)
  } catch (error) {
    console.error(`Failed to start Discord bot for ${userId}:`, error)
    try {
      client.destroy()
    } catch {}
    return null
  }

  await registerDiscordCommands(token, client.user!.id)
  console.log(`Discord Bot for ${userId} is online as ${client.user?.tag}`)
  return client
}

async function handleDiscordInteraction(
  interaction: ChatInputCommandInteraction<CacheType>,
  userId: string,
) {
  if (interaction.commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("Vouched.to — Bot Commands")
      .setColor("#6366f1")
      .setDescription("Collect and showcase verified vouches.")
      .addFields(
        { name: "/vouch", value: "Leave a vouch: a 1–5 rating, a comment, and an optional proof screenshot." },
        { name: "/stats", value: "View this profile's vouch count, average score, and leaderboard rank." },
        { name: "/report <vouch_id> [reason]", value: "Report a vouch to the owner for moderation." },
        { name: "/blacklist <add|remove> <user_id> [reason]", value: "Owner only — Manage blacklisted users." },
        { name: "/moderate <list|approve|remove>", value: "Owner only — Manage reported/flagged vouches." },
        { name: "/restore", value: "Owner only — re-post the full vouch history into this channel." },
      )
      .setFooter({ text: "Powered by Vouched.to" })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("vouch_btn")
        .setLabel("⭐ Leave a Vouch")
        .setStyle(ButtonStyle.Success)
    )

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
  }

  if (interaction.commandName === "vouch") {
    const rating = interaction.options.getInteger("rating")
    const comment = interaction.options.getString("comment")
    const proof = interaction.options.getAttachment("proof")

    if (rating === null || comment === null) {
      const modal = new ModalBuilder()
        .setCustomId(`vouch_modal_${userId}`)
        .setTitle("Leave a Vouch")

      const ratingInput = new TextInputBuilder()
        .setCustomId("rating")
        .setLabel("Rating (1-5)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. 5")
        .setMinLength(1)
        .setMaxLength(1)
        .setRequired(true)

      const commentInput = new TextInputBuilder()
        .setCustomId("comment")
        .setLabel("Your Feedback")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Describe your experience with this seller...")
        .setMinLength(4)
        .setRequired(true)

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ratingInput)
      const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(commentInput)

      modal.addComponents(firstActionRow, secondActionRow)

      await interaction.showModal(modal)
      return
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: { select: { vouchesReceived: true } },
        },
      })

      if (!user) {
        return interaction.reply({ content: "❌ User not found.", ephemeral: true })
      }

      const premium = hasActivePremium(user)

      if (!premium && user._count.vouchesReceived >= FREE_VOUCH_LIMIT) {
        return interaction.reply({
          content: `❌ This user has reached the maximum limit of ${FREE_VOUCH_LIMIT} vouches for free accounts. They need to upgrade to Premium to receive more.`,
          ephemeral: true,
        })
      }

      if (user.vouchRequireProof && !proof) {
        return interaction.reply({
          content: "❌ This user requires proof (screenshot) for every vouch.",
          ephemeral: true,
        })
      }

      // Run Phase 1 anti-abuse and validation rules
      try {
        await validateVouchRules({
          receiverId: userId,
          giverId: interaction.user.id,
          platform: "discord",
          comment,
        })
      } catch (validationErr: any) {
        return interaction.reply({
          content: `❌ ${validationErr.message}`,
          ephemeral: true,
        })
      }

      let proofUrl: string | null = null

      if (proof) {
        const fileExtension = proof.name.split(".").pop() || "png"
        const key = proofKey("discord", fileExtension)
        proofUrl = await persistProofToR2(proof.url, key, proof.contentType || "image/png")

        // If proof is mandatory but we couldn't store it, don't save a
        // proofless vouch — ask them to retry rather than silently dropping it.
        if (user.vouchRequireProof && !proofUrl) {
          return interaction.reply({
            content: "❌ Could not save your proof image right now (storage unavailable). Please try again later.",
            ephemeral: true,
          })
        }
      }

      const createdVouch = await prisma.vouch.create({
        data: {
          receiverId: userId,
          platform: "discord",
          giverId: interaction.user.id,
          giverName: interaction.user.username,
          sourceId: interaction.guildId || "DM",
          sourceName: interaction.guild?.name ?? null,
          rating,
          comment,
          proofImageUrl: proofUrl,
          createdAt: new Date(),
        },
      })

      // Generate permalink
      const baseUrl = process.env.AUTH_URL || "https://vouched.to"
      const permalink = user.slug ? `${baseUrl}/u/${user.slug}#vouch-${createdVouch.id}` : null

      // Build Custom Embed
      const stars = "⭐".repeat(rating)
      const embed = new EmbedBuilder()
        .setTitle(user.vouchEmbedTitle)
        .setColor(user.vouchEmbedColor as any)
        .setFooter({ text: `${user.vouchEmbedFooter} • ID: ${createdVouch.id}` })
        .setTimestamp()
        .addFields({ name: "Vouch:", value: comment }, { name: "Rating:", value: stars, inline: true })

      if (permalink) {
        embed.setURL(permalink)
      }

      if (user.vouchShowCount) {
        embed.addFields({
          name: "Vouch Nº:",
          value: `${user._count.vouchesReceived + 1}`,
          inline: true,
        })
      }

      if (user.vouchTagUser) {
        embed.addFields({ name: "Vouched by:", value: `<@${interaction.user.id}>`, inline: true })
      }

      if (proofUrl) {
        embed.setImage(proofUrl)
      }

      // Handle Custom Channel/Role/Emoji for Premium
      let responseContent = "✅ **Vouch Recorded!**"
      if (premium && user.vouchEmoji) {
        responseContent = `${user.vouchEmoji} **Vouch Recorded!**`
      }

      // Premium: ping a configured role on the announcement. We ping it on the
      // dedicated channel post when one is set, otherwise on the reply — never
      // both, to avoid a double notification.
      const roleMention = premium && user.vouchRoleId ? `<@&${user.vouchRoleId}>` : ""
      const roleAllowedMentions = roleMention ? { roles: [user.vouchRoleId!] } : undefined

      // If a specific channel is set and user is premium, send there too
      let announcedToChannel = false
      if (premium && user.vouchChannelId) {
        try {
          const channel = await interaction.client.channels.fetch(user.vouchChannelId)
          if (channel && channel.isTextBased()) {
            await (channel as any).send({
              content: roleMention || undefined,
              embeds: [embed],
              allowedMentions: roleAllowedMentions,
            })
            announcedToChannel = true
          }
        } catch (err) {
          console.error("Failed to send vouch to custom channel:", err)
        }
      }

      await interaction.reply({
        content:
          roleMention && !announcedToChannel ? `${roleMention} ${responseContent}` : responseContent,
        embeds: [embed],
        allowedMentions: roleMention && !announcedToChannel ? roleAllowedMentions : undefined,
        ephemeral: false,
      })
    } catch (err) {
      console.error("Error saving vouch:", err)
      await interaction.reply({
        content: "❌ Failed to save vouch. Please try again later.",
        ephemeral: true,
      })
    }
  }

  if (interaction.commandName === "stats") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: { select: { vouchesReceived: true } },
          vouchesReceived: { select: { rating: true } },
        },
      })

      if (!user) {
        return interaction.reply({ content: "❌ User not found.", ephemeral: true })
      }

      const count = user._count.vouchesReceived
      const totalRating = user.vouchesReceived.reduce((acc, v) => acc + v.rating, 0)
      const averageRating = count > 0 ? (totalRating / count).toFixed(1) : "0.0"

      const embed = new EmbedBuilder()
        .setTitle(user.statsEmbedTitle)
        .setDescription(user.statsEmbedDescription)
        .setColor(user.statsEmbedColor as any)
        .setFooter({ text: user.statsEmbedFooter })
        .setTimestamp()

      if (user.statsShowCount) {
        embed.addFields({ name: "Nº Vouches:", value: `${count}`, inline: true })
      }

      if (user.statsShowScore) {
        embed.addFields({ name: "Score:", value: `${averageRating} / 5.0`, inline: true })
      }

      if (user.statsShowLeaderboard) {
        const rank = await getLeaderboardRank(count)
        embed.addFields({ name: "Leaderboard:", value: rank > 0 ? `#${rank}` : "Unranked", inline: true })
      }

      if (user.statsShowPlan) {
        embed.addFields({
          name: "Plan:",
          value: hasActivePremium(user) ? "Premium Plan" : "Free Plan",
          inline: true,
        })
      }

      if (user.statsShowExpiration && user.premiumExpiresAt) {
        embed.addFields({
          name: "Renews/Expires:",
          value: user.premiumExpiresAt.toLocaleDateString(),
          inline: true,
        })
      }

      if (user.statsShowAge) {
        embed.addFields({
          name: "Member Since:",
          value: user.emailVerified?.toLocaleDateString() || "N/A",
          inline: true,
        })
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("vouch_btn")
          .setLabel("⭐ Leave a Vouch")
          .setStyle(ButtonStyle.Success)
      )

      await interaction.reply({ embeds: [embed], components: [row] })
    } catch (err) {
      console.error("Error fetching stats:", err)
      await interaction.reply({ content: "❌ Failed to fetch stats.", ephemeral: true })
    }
  }

  if (interaction.commandName === "restore") {
    // Check if it's the owner
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the owner can use this command.", ephemeral: true })
    }

    await interaction.reply({ content: "⏳ Starting restoration of all vouches...", ephemeral: true })

    const vouches = await prisma.vouch.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "asc" },
    })

    const channel = interaction.channel
    if (!channel) return

    for (const vouch of vouches) {
      const stars = "⭐".repeat(vouch.rating)
      const content = `**Vouch from ${vouch.giverName}**\nRating: ${stars}\nComment: ${vouch.comment}`

      const messageOptions: { content: string; files?: string[] } = { content }
      if (vouch.proofImageUrl) {
        messageOptions.files = [vouch.proofImageUrl]
      }

      try {
        if (channel && "send" in channel) {
          await (channel as any).send(messageOptions)
        }
      } catch (sendErr) {
        console.error("Failed to send message during restore:", sendErr)
      }

      // Delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    await interaction.followUp({ content: "✅ Restoration complete!", ephemeral: true })
  }

  if (interaction.commandName === "blacklist") {
    // Check if it's the owner
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the profile owner can use this command.", ephemeral: true })
    }

    const subcommand = interaction.options.getSubcommand()
    const targetUserId = interaction.options.getString("user_id", true)

    if (subcommand === "add") {
      const reason = interaction.options.getString("reason")
      await addToBlacklist({
        userId,
        platform: "discord",
        blockedId: targetUserId,
        reason,
      })
      return interaction.reply({
        content: `✅ User with ID \`${targetUserId}\` has been blacklisted.`,
        ephemeral: true,
      })
    } else if (subcommand === "remove") {
      const success = await removeFromBlacklist({
        userId,
        platform: "discord",
        blockedId: targetUserId,
      })
      if (success) {
        return interaction.reply({
          content: `✅ User with ID \`${targetUserId}\` has been removed from the blacklist.`,
          ephemeral: true,
        })
      } else {
        return interaction.reply({
          content: `❌ User with ID \`${targetUserId}\` was not on the blacklist.`,
          ephemeral: true,
        })
      }
    }
  }

  if (interaction.commandName === "report") {
    const vouchId = interaction.options.getString("vouch_id", true)
    const reason = interaction.options.getString("reason")

    try {
      await reportVouch({
        vouchId,
        reporterId: interaction.user.id,
        reason,
      })
      return interaction.reply({
        content: `⚠️ Vouch \`${vouchId}\` has been reported to the seller for moderation.`,
        ephemeral: true,
      })
    } catch (err: any) {
      return interaction.reply({
        content: `❌ Error: ${err.message}`,
        ephemeral: true,
      })
    }
  }

  if (interaction.commandName === "moderate") {
    // Check if it's the owner
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the profile owner can use this command.", ephemeral: true })
    }

    const subcommand = interaction.options.getSubcommand()

    if (subcommand === "list") {
      const reports = await getPendingReports(userId)
      if (reports.length === 0) {
        return interaction.reply({ content: "✅ No pending reports in your moderation queue.", ephemeral: true })
      }

      const embed = new EmbedBuilder()
        .setTitle("⚠️ Pending Vouch Moderation Queue")
        .setColor("#F59E0B")
        .setDescription("The following vouches have been flagged. Use `/moderate approve <vouch_id>` or `/moderate remove <vouch_id>` to resolve them.")

      reports.slice(0, 10).forEach((v, index) => {
        embed.addFields({
          name: `Report #${index + 1} (ID: ${v.id})`,
          value: `**Giver:** ${v.giverName} (${v.giverId})\n**Rating:** ${"⭐".repeat(v.rating)}\n**Comment:** ${v.comment || "No comment"}\n**Date:** ${v.createdAt.toLocaleDateString()}`,
        })
      })

      if (reports.length > 10) {
        embed.setFooter({ text: `Showing first 10 of ${reports.length} pending reports.` })
      }

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    if (subcommand === "approve") {
      const vouchId = interaction.options.getString("vouch_id", true)
      try {
        await approveVouch(userId, vouchId)
        return interaction.reply({
          content: `✅ Vouch \`${vouchId}\` has been approved and marked active.`,
          ephemeral: true,
        })
      } catch (err: any) {
        return interaction.reply({
          content: `❌ Error: ${err.message}`,
          ephemeral: true,
        })
      }
    }

    if (subcommand === "remove") {
      const vouchId = interaction.options.getString("vouch_id", true)
      try {
        await removeVouch(userId, vouchId)
        return interaction.reply({
          content: `✅ Vouch \`${vouchId}\` has been soft-deleted and removed from public profile.`,
          ephemeral: true,
        })
      } catch (err: any) {
        return interaction.reply({
          content: `❌ Error: ${err.message}`,
          ephemeral: true,
        })
      }
    }
  }
}

async function handleDiscordButton(interaction: ButtonInteraction<CacheType>, botUserId: string) {
  if (interaction.customId === "vouch_btn") {
    // Open the modal
    const modal = new ModalBuilder()
      .setCustomId(`vouch_modal_${botUserId}`)
      .setTitle("Leave a Vouch")

    const ratingInput = new TextInputBuilder()
      .setCustomId("rating")
      .setLabel("Rating (1-5)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. 5")
      .setMinLength(1)
      .setMaxLength(1)
      .setRequired(true)

    const commentInput = new TextInputBuilder()
      .setCustomId("comment")
      .setLabel("Your Feedback")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Describe your experience with this seller...")
      .setMinLength(4)
      .setRequired(true)

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ratingInput)
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(commentInput)

    modal.addComponents(firstActionRow, secondActionRow)

    await interaction.showModal(modal)
    return
  }

  if (interaction.customId.startsWith("confirm_vouch_")) {
    const pendingId = interaction.customId.split("confirm_vouch_")[1]
    const pending = pendingDiscordVouches.get(pendingId)

    if (!pending) {
      return interaction.update({
        content: "❌ This vouch preview has expired. Please try leaving a vouch again.",
        embeds: [],
        components: [],
      })
    }

    const { receiverId, rating, comment } = pending

    try {
      // Re-run validation rules to prevent race conditions
      await validateVouchRules({
        receiverId,
        giverId: interaction.user.id,
        platform: "discord",
        comment,
      })
    } catch (err: any) {
      pendingDiscordVouches.delete(pendingId)
      return interaction.update({
        content: `❌ Validation failed: ${err.message}`,
        embeds: [],
        components: [],
      })
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: receiverId },
        include: {
          _count: { select: { vouchesReceived: true } },
        },
      })

      if (!user) {
        pendingDiscordVouches.delete(pendingId)
        return interaction.update({
          content: "❌ Seller profile not found.",
          embeds: [],
          components: [],
        })
      }

      // Check premium vouch limit
      const premium = hasActivePremium(user)
      if (!premium && user._count.vouchesReceived >= FREE_VOUCH_LIMIT) {
        pendingDiscordVouches.delete(pendingId)
        return interaction.update({
          content: `❌ Vouch limit (${FREE_VOUCH_LIMIT}) reached.`,
          embeds: [],
          components: [],
        })
      }

      // Create vouch
      const createdVouch = await prisma.vouch.create({
        data: {
          receiverId,
          platform: "discord",
          giverId: interaction.user.id,
          giverName: interaction.user.username,
          sourceId: interaction.guildId || "DM",
          sourceName: interaction.guild?.name ?? null,
          rating,
          comment,
          createdAt: new Date(),
        },
      })

      pendingDiscordVouches.delete(pendingId)

      // Generate permalink
      const baseUrl = process.env.AUTH_URL || "https://vouched.to"
      const permalink = user.slug ? `${baseUrl}/u/${user.slug}#vouch-${createdVouch.id}` : null

      // Build Embed
      const stars = "⭐".repeat(rating)
      const embed = new EmbedBuilder()
        .setTitle(user.vouchEmbedTitle)
        .setColor(user.vouchEmbedColor as any)
        .setFooter({ text: `${user.vouchEmbedFooter} • ID: ${createdVouch.id}` })
        .setTimestamp()
        .addFields({ name: "Vouch:", value: comment }, { name: "Rating:", value: stars, inline: true })

      if (permalink) {
        embed.setURL(permalink)
      }

      if (user.vouchShowCount) {
        embed.addFields({
          name: "Vouch Nº:",
          value: `${user._count.vouchesReceived + 1}`,
          inline: true,
        })
      }

      if (user.vouchTagUser) {
        embed.addFields({ name: "Vouched by:", value: `<@${interaction.user.id}>`, inline: true })
      }

      // Handle Custom Channel/Role/Emoji for Premium
      let responseContent = "✅ **Vouch Recorded!**"
      if (premium && user.vouchEmoji) {
        responseContent = `${user.vouchEmoji} **Vouch Recorded!**`
      }

      const roleMention = premium && user.vouchRoleId ? `<@&${user.vouchRoleId}>` : ""
      const roleAllowedMentions = roleMention ? { roles: [user.vouchRoleId!] } : undefined

      let announcedToChannel = false
      if (premium && user.vouchChannelId) {
        try {
          const channel = await interaction.client.channels.fetch(user.vouchChannelId)
          if (channel && channel.isTextBased()) {
            await (channel as any).send({
              content: roleMention || undefined,
              embeds: [embed],
              allowedMentions: roleAllowedMentions,
            })
            announcedToChannel = true
          }
        } catch (err) {
          console.error("Failed to send vouch to custom channel:", err)
        }
      }

      // Update preview interaction to show vouch recorded
      await interaction.update({
        content: "✅ Vouch submitted successfully!",
        embeds: [],
        components: [],
      })

      // If it wasn't announced to a dedicated channel (or we want to post it in the current channel too),
      // we send it to the channel where it was initiated. Since the preview is ephemeral, we send a new message.
      if (!announcedToChannel) {
        const channel = interaction.channel
        if (channel && "send" in channel) {
          await (channel as any).send({
            content: roleMention || undefined,
            embeds: [embed],
            allowedMentions: roleAllowedMentions,
          })
        }
      }
    } catch (err) {
      console.error("Error finalizing vouch button confirm:", err)
      return interaction.followUp({
        content: "❌ An error occurred while saving your vouch.",
        ephemeral: true,
      })
    }
    return
  }

  if (interaction.customId.startsWith("cancel_vouch_")) {
    const pendingId = interaction.customId.split("cancel_vouch_")[1]
    pendingDiscordVouches.delete(pendingId)
    await interaction.update({
      content: "❌ Vouch cancelled.",
      embeds: [],
      components: [],
    })
  }
}

async function handleDiscordModalSubmit(interaction: ModalSubmitInteraction<CacheType>, botUserId: string) {
  if (interaction.customId.startsWith("vouch_modal_")) {
    const receiverId = interaction.customId.split("vouch_modal_")[1]
    const ratingStr = interaction.fields.getTextInputValue("rating")
    const comment = interaction.fields.getTextInputValue("comment")
    const rating = parseInt(ratingStr)

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return interaction.reply({
        content: "❌ Invalid rating. Please enter a number between 1 and 5.",
        ephemeral: true,
      })
    }

    try {
      // Run validation rules
      await validateVouchRules({
        receiverId,
        giverId: interaction.user.id,
        platform: "discord",
        comment,
      })
    } catch (err: any) {
      return interaction.reply({
        content: `❌ ${err.message}`,
        ephemeral: true,
      })
    }

    // Save pending vouch
    const pendingId = uuidv4()
    pendingDiscordVouches.set(pendingId, { receiverId, rating, comment })

    // Build Preview Embed
    const stars = "⭐".repeat(rating)
    const previewEmbed = new EmbedBuilder()
      .setTitle("📝 Vouch Preview")
      .setColor("#F59E0B")
      .setDescription("Please review your vouch before submitting.")
      .addFields(
        { name: "Rating:", value: stars, inline: true },
        { name: "Feedback:", value: comment }
      )
      .setFooter({ text: "This is a preview. Click Confirm to post it." })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_vouch_${pendingId}`)
        .setLabel("Confirm Vouch")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`cancel_vouch_${pendingId}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    )

    await interaction.reply({
      embeds: [previewEmbed],
      components: [row],
      ephemeral: true,
    })
  }
}

