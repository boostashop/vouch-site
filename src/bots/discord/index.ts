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
  isMilestone,
  getActiveConfig,
} from "../vouch-service"
import { registerDiscordCommands } from "./commands"
import { getSignedProofUrl } from "../../lib/proof-url"

// In-memory cache for pending modal/button vouches to support preview/confirmation
const pendingDiscordVouches = new Map<string, { receiverId: string; rating: number; comment: string }>()

// Spawn a Discord client for a user's bot token. Returns the logged-in client,
// or null if login failed (so the manager can back off). The manager owns the
// client map; this module owns command registration + interaction handling.
export async function spawnDiscordBot(userId: string, token: string): Promise<Client | null> {
  console.log(`Spawning Discord bot for User ID: ${userId}`)

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
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

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return
    const guildId = message.guildId
    if (!guildId) return

    try {
      const config = await getActiveConfig(userId, guildId)
      if (config && config.isPremium && config.vouchChannelId === message.channelId) {
        await message.delete()
      }
    } catch (err) {
      console.error("Failed to delete non-vouch message in vouch-only channel:", err)
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
      const config = await getActiveConfig(userId, interaction.guildId)
      if (!config) {
        return interaction.reply({ content: "❌ User not found.", ephemeral: true })
      }

      const totalVouches = await prisma.vouch.count({
        where: { receiverId: userId, status: "ACTIVE" },
      })

      if (!config.isPremium && totalVouches >= FREE_VOUCH_LIMIT) {
        return interaction.reply({
          content: `❌ This user has reached the maximum limit of ${FREE_VOUCH_LIMIT} vouches for free accounts. They need to upgrade to Premium to receive more.`,
          ephemeral: true,
        })
      }

      if (config.requireProof && !proof) {
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
          guildId: interaction.guildId,
          giverCreatedAt: interaction.user.createdAt,
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
        if (config.requireProof && !proofUrl) {
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

      // Premium: Role rewards
      if (config.isPremium && config.vouchRoleId && interaction.guild) {
        try {
          const member = await interaction.guild.members.fetch(interaction.user.id)
          if (member) {
            await member.roles.add(config.vouchRoleId)
          }
        } catch (roleErr) {
          console.error("Failed to assign role reward to vouch giver:", roleErr)
        }
      }

      // Generate permalink
      const baseUrl = process.env.AUTH_URL || "https://vouched.to"
      const permalink = config.slug ? `${baseUrl}/u/${config.slug}#vouch-${createdVouch.id}` : null

      // Build Custom Embed
      const stars = "⭐".repeat(rating)
      const embed = new EmbedBuilder()
        .setTitle(config.vouchEmbedTitle)
        .setColor(config.vouchEmbedColor as any)
        .setFooter({ text: `${config.vouchEmbedFooter} • ID: ${createdVouch.id}` })
        .setTimestamp()
        .addFields({ name: "Vouch:", value: comment }, { name: "Rating:", value: stars, inline: true })

      if (permalink) {
        embed.setURL(permalink)
      }

      if (config.vouchShowCount) {
        embed.addFields({
          name: "Vouch Nº:",
          value: `${totalVouches + 1}`,
          inline: true,
        })
      }

      if (config.vouchTagUser) {
        embed.addFields({ name: "Vouched by:", value: `<@${interaction.user.id}>`, inline: true })
      }

      if (proofUrl) {
        embed.setImage(getSignedProofUrl(proofUrl)!)
      }

      // Handle Custom Channel/Role/Emoji for Premium
      let responseContent = "✅ **Vouch Recorded!**"
      if (config.isPremium && config.vouchEmoji) {
        responseContent = `${config.vouchEmoji} **Vouch Recorded!**`
      }

      // Premium: ping a configured role on the announcement. We ping it on the
      // dedicated channel post when one is set, otherwise on the reply — never
      // both, to avoid a double notification.
      const roleMention = config.isPremium && config.vouchRoleId ? `<@&${config.vouchRoleId}>` : ""
      const roleAllowedMentions = roleMention ? { roles: [config.vouchRoleId!] } : undefined

      // If a specific channel is set and user is premium, send there too
      let announcedToChannel = false
      const profileRow = new ActionRowBuilder<ButtonBuilder>()
      if (permalink) {
        profileRow.addComponents(
          new ButtonBuilder()
            .setLabel("🌐 View Profile")
            .setStyle(ButtonStyle.Link)
            .setURL(`${baseUrl}/u/${config.slug}`)
        )
      }

      if (config.isPremium && config.vouchChannelId) {
        try {
          const channel = await interaction.client.channels.fetch(config.vouchChannelId)
          if (channel && channel.isTextBased()) {
            await (channel as any).send({
              content: roleMention || undefined,
              embeds: [embed],
              components: permalink ? [profileRow] : [],
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
        components: permalink ? [profileRow] : [],
        allowedMentions: roleMention && !announcedToChannel ? roleAllowedMentions : undefined,
        ephemeral: false,
      })

      // Trigger pinned live card update
      if (interaction.guildId) {
        await updatePinnedLiveCard(interaction.client, userId, interaction.guildId)
      }

      // Phase 3: Owner DM
      if (config.discordId) {
        try {
          const ownerUser = await interaction.client.users.fetch(config.discordId)
          if (ownerUser) {
            const dmEmbed = new EmbedBuilder()
              .setTitle("🔔 New Vouch Received!")
              .setColor("#10B981")
              .setDescription(`You received a new vouch from **${interaction.user.username}**!`)
              .addFields(
                { name: "Rating:", value: "⭐".repeat(rating), inline: true },
                { name: "Comment:", value: comment }
              )
              .setFooter({ text: `Vouch ID: ${createdVouch.id}` })
              .setTimestamp()
            await ownerUser.send({ embeds: [dmEmbed] })
          }
        } catch (dmErr) {
          console.error("Failed to DM owner about new vouch in Discord:", dmErr)
        }
      }

      // Phase 3: Milestone Announcement
      if (isMilestone(totalVouches + 1)) {
        const milestoneEmbed = new EmbedBuilder()
          .setTitle("🎉 Vouch Milestone Reached!")
          .setColor("#3B82F6")
          .setDescription(`🚀 **${config.name || config.username || "Seller"}** has reached **${totalVouches + 1}** verified vouches!`)
          .setFooter({ text: "Verify all reviews on Vouched.to" })

        const destChannels = []
        destChannels.push(interaction.channel)
        if (config.isPremium && config.vouchChannelId && config.vouchChannelId !== interaction.channelId) {
          try {
            const ch = await interaction.client.channels.fetch(config.vouchChannelId)
            if (ch && ch.isTextBased()) destChannels.push(ch)
          } catch {}
        }
        for (const ch of destChannels) {
          if (ch) {
            try {
              await (ch as any).send({ embeds: [milestoneEmbed] })
            } catch (err) {
              console.error("Failed to post milestone to channel:", err)
            }
          }
        }
      }
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
        const signedUrl = getSignedProofUrl(vouch.proofImageUrl)
        if (signedUrl) {
          messageOptions.files = [signedUrl]
        }
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

  if (interaction.commandName === "profile") {
    const targetUser = interaction.options.getUser("user")
    let targetId = userId
    if (targetUser) {
      const u = await prisma.user.findUnique({
        where: { discordId: targetUser.id }
      })
      if (!u) {
        return interaction.reply({
          content: `❌ This user does not have a Vouched.to seller profile linked.`,
          ephemeral: true
        })
      }
      targetId = u.id
    }

    try {
      const profileUser = await prisma.user.findUnique({
        where: { id: targetId },
        include: {
          _count: { select: { vouchesReceived: true } },
          vouchesReceived: { select: { rating: true } }
        }
      })
      if (!profileUser) {
        return interaction.reply({ content: "❌ Profile not found.", ephemeral: true })
      }
      const count = profileUser._count.vouchesReceived
      const totalRating = profileUser.vouchesReceived.reduce((acc, v) => acc + v.rating, 0)
      const averageRating = count > 0 ? (totalRating / count).toFixed(1) : "0.0"
      const rank = await getLeaderboardRank(count)

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${profileUser.name || profileUser.username || "Seller"}'s Profile`)
        .setColor((profileUser.vouchEmbedColor as any) || "#6366f1")
        .setDescription(profileUser.profileMetaDescription || "Check out my verified reputation!")
        .addFields(
          { name: "Score:", value: `⭐ ${averageRating} / 5.0`, inline: true },
          { name: "Total Reviews:", value: `📝 ${count}`, inline: true },
          { name: "Rank:", value: `🏆 ${rank > 0 ? `#${rank}` : "Unranked"}`, inline: true }
        )
        .setFooter({ text: "Verified by Vouched.to" })
        .setTimestamp()

      const row = new ActionRowBuilder<ButtonBuilder>()
      const baseUrl = process.env.AUTH_URL || "https://vouched.to"
      if (profileUser.slug) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel("🌐 View Full Profile")
            .setStyle(ButtonStyle.Link)
            .setURL(`${baseUrl}/u/${profileUser.slug}`),
          new ButtonBuilder()
            .setCustomId("vouch_btn")
            .setLabel("⭐ Leave a Vouch")
            .setStyle(ButtonStyle.Success)
        )
      } else {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("vouch_btn")
            .setLabel("⭐ Leave a Vouch")
            .setStyle(ButtonStyle.Success)
        )
      }
      return interaction.reply({ embeds: [embed], components: [row] })
    } catch (err) {
      console.error("Error fetching profile:", err)
      return interaction.reply({ content: "❌ Failed to fetch profile.", ephemeral: true })
    }
  }

  if (interaction.commandName === "leaderboard") {
    const scope = interaction.options.getString("scope") || "global"
    let topSellers = []

    try {
      if (scope === "server" && interaction.guildId) {
        topSellers = await prisma.vouch.groupBy({
          by: ['receiverId'],
          where: {
            sourceId: interaction.guildId,
            status: "ACTIVE"
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        })
      } else {
        topSellers = await prisma.vouch.groupBy({
          by: ['receiverId'],
          where: { status: "ACTIVE" },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        })
      }

      if (topSellers.length === 0) {
        return interaction.reply({ content: "ℹ️ No vouches recorded yet.", ephemeral: true })
      }

      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${scope === "server" ? "Server" : "Global"} Leaderboard`)
        .setColor("#F59E0B")
        .setDescription("Top sellers ranked by verified vouch count.")

      for (let i = 0; i < topSellers.length; i++) {
        const sellerId = topSellers[i].receiverId
        const sellerCount = topSellers[i]._count.id
        const sellerUser = await prisma.user.findUnique({
          where: { id: sellerId }
        })
        if (sellerUser) {
          const sellerName = sellerUser.name || sellerUser.username || "Anonymous Seller"
          const baseUrl = process.env.AUTH_URL || "https://vouched.to"
          embed.addFields({
            name: `#${i + 1} - ${sellerName}`,
            value: `Total Vouches: **${sellerCount}** • ${sellerUser.slug ? `[View Profile](${baseUrl}/u/${sellerUser.slug})` : "No profile slug"}`,
          })
        }
      }

      return interaction.reply({ embeds: [embed] })
    } catch (err) {
      console.error("Error fetching leaderboard:", err)
      return interaction.reply({ content: "❌ Failed to fetch leaderboard.", ephemeral: true })
    }
  }

  if (interaction.commandName === "recent") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      if (!user) {
        return interaction.reply({ content: "❌ Seller profile not found.", ephemeral: true })
      }

      const recentVouches = await prisma.vouch.findMany({
        where: {
          receiverId: userId,
          status: "ACTIVE"
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 3
      })

      if (recentVouches.length === 0) {
        return interaction.reply({ content: "ℹ️ No vouches recorded for this profile yet.", ephemeral: true })
      }

      const embed = new EmbedBuilder()
        .setTitle(`🕒 Recent Vouches for ${user.name || user.username || "Seller"}`)
        .setColor("#6366f1")

      recentVouches.forEach((v, index) => {
        const stars = "⭐".repeat(v.rating)
        let val = `"${v.comment || "No comment"}"`
        if (v.sellerReply) {
          val += `\n↳ *Response:* "${v.sellerReply}"`
        }
        val += `\n_Date: ${v.createdAt.toLocaleDateString()}_`
        embed.addFields({
          name: `Vouch #${index + 1} from ${v.giverName} (${stars})`,
          value: val
        })
      })

      return interaction.reply({ embeds: [embed] })
    } catch (err) {
      console.error("Error in recent command:", err)
      return interaction.reply({ content: "❌ Error fetching recent vouches.", ephemeral: true })
    }
  }

  if (interaction.commandName === "find") {
    const query = interaction.options.getString("query", true)
    const isRating = /^[1-5]$/.test(query.trim())
    const searchRating = isRating ? parseInt(query.trim()) : undefined

    try {
      const results = await prisma.vouch.findMany({
        where: {
          receiverId: userId,
          status: "ACTIVE",
          OR: searchRating
            ? [{ rating: searchRating }]
            : [
                { comment: { contains: query, mode: "insensitive" } },
                { giverName: { contains: query, mode: "insensitive" } },
              ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      })

      if (results.length === 0) {
        return interaction.reply({ content: `ℹ️ No active vouches found matching \`${query}\`.`, ephemeral: true })
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Search Results for "${query}"`)
        .setColor("#10B981")
        .setDescription(`Showing up to 5 matching vouches.`)

      results.forEach((v, index) => {
        const stars = "⭐".repeat(v.rating)
        let val = `"${v.comment || "No comment"}"`
        if (v.sellerReply) {
          val += `\n↳ *Response:* "${v.sellerReply}"`
        }
        val += `\n_ID: ${v.id} • ${v.createdAt.toLocaleDateString()}_`
        embed.addFields({
          name: `Result #${index + 1} | By: ${v.giverName} (${stars})`,
          value: val
        })
      })

      return interaction.reply({ embeds: [embed] })
    } catch (err) {
      console.error("Error searching vouches:", err)
      return interaction.reply({ content: "❌ Error searching vouches.", ephemeral: true })
    }
  }

  if (interaction.commandName === "config") {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the profile owner can use this command.", ephemeral: true })
    }

    const channel = interaction.options.getChannel("channel")
    const requireProof = interaction.options.getBoolean("require_proof")
    const minAccountAge = interaction.options.getInteger("min_account_age")

    const guildId = interaction.guildId
    if (!guildId) {
      return interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true })
    }

    const existing = await prisma.guildConfig.findUnique({
      where: { userId_guildId: { userId, guildId } },
    })

    const data = {
      vouchChannelId: channel ? channel.id : (existing ? existing.vouchChannelId : null),
      requireProof: requireProof !== null ? requireProof : (existing ? existing.requireProof : false),
      minAccountAgeDays: minAccountAge !== null ? minAccountAge : (existing ? existing.minAccountAgeDays : 0),
    }

    const updated = await prisma.guildConfig.upsert({
      where: { userId_guildId: { userId, guildId } },
      create: {
        userId,
        guildId,
        ...data,
      },
      update: data,
    })

    // Trigger pinned live card update
    await updatePinnedLiveCard(interaction.client, userId, guildId)

    const channelMention = updated.vouchChannelId ? `<#${updated.vouchChannelId}>` : "None"
    return interaction.reply({
      content: `✅ **Server Configuration Updated!**\n\n` +
               `• **Announcement Channel:** ${channelMention}\n` +
               `• **Require Proof:** \`${updated.requireProof}\`\n` +
               `• **Min Account Age:** \`${updated.minAccountAgeDays} days\``,
      ephemeral: true,
    })
  }

  if (interaction.commandName === "remove") {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the profile owner can use this command.", ephemeral: true })
    }

    const vouchId = interaction.options.getString("vouch_id", true)
    try {
      await removeVouch(userId, vouchId)
      // Trigger pinned live card update if in guild
      if (interaction.guildId) {
        await updatePinnedLiveCard(interaction.client, userId, interaction.guildId)
      }
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

  if (interaction.commandName === "export") {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the profile owner can use this command.", ephemeral: true })
    }

    const config = await getActiveConfig(userId, interaction.guildId)
    if (!config || !config.isPremium) {
      return interaction.reply({
        content: "❌ This command is premium-gated. Upgrade to Premium to export your vouch data.",
        ephemeral: true,
      })
    }

    await interaction.deferReply({ ephemeral: true })

    try {
      const vouches = await prisma.vouch.findMany({
        where: { receiverId: userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      })

      const jsonContent = JSON.stringify(vouches, null, 2)
      const buffer = Buffer.from(jsonContent, "utf-8")

      const ownerUser = await interaction.client.users.fetch(user.discordId)
      if (ownerUser) {
        await ownerUser.send({
          content: `📊 Here is your Vouched.to data export. It contains ${vouches.length} active vouches.`,
          files: [{ attachment: buffer, name: `vouches_export_${userId}.json` }],
        })
        return interaction.editReply({
          content: "✅ Your data has been exported and sent to your DMs!",
        })
      } else {
        return interaction.editReply({
          content: "❌ Could not open a DM with you. Please make sure your DMs are open.",
        })
      }
    } catch (err) {
      console.error("Failed to export vouches:", err)
      return interaction.editReply({
        content: "❌ Failed to export vouch data.",
      })
    }
  }

  if (interaction.commandName === "reply") {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the profile owner can use this command.", ephemeral: true })
    }

    const vouchId = interaction.options.getString("vouch_id", true)
    const response = interaction.options.getString("response", true)

    try {
      const vouch = await prisma.vouch.findUnique({
        where: { id: vouchId },
      })

      if (!vouch || vouch.receiverId !== userId) {
        return interaction.reply({ content: "❌ Vouch not found or unauthorized.", ephemeral: true })
      }

      await prisma.vouch.update({
        where: { id: vouchId },
        data: { sellerReply: response },
      })

      if (interaction.guildId) {
        await updatePinnedLiveCard(interaction.client, userId, interaction.guildId)
      }

      return interaction.reply({
        content: `✅ Successfully replied to vouch \`${vouchId}\`!\n\n**Reply:** "${response}"`,
        ephemeral: true,
      })
    } catch (err: any) {
      return interaction.reply({
        content: `❌ Error: ${err.message}`,
        ephemeral: true,
      })
    }
  }

  if (interaction.commandName === "import") {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.discordId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Only the profile owner can use this command.", ephemeral: true })
    }

    const limit = interaction.options.getInteger("limit") || 100
    await interaction.deferReply({ ephemeral: true })

    try {
      let messagesList: any[] = []
      let lastId = undefined
      let remaining = limit

      while (remaining > 0) {
        const fetchLimit = Math.min(remaining, 100)
        const options: any = { limit: fetchLimit }
        if (lastId) {
          options.before = lastId
        }
        const batch: any = await interaction.channel?.messages.fetch(options)
        if (!batch || batch.size === 0) break

        messagesList = messagesList.concat(Array.from(batch.values()))
        lastId = batch.lastKey()
        remaining -= batch.size
        if (batch.size < fetchLimit) break
      }

      let importedCount = 0
      for (const msg of messagesList) {
        if (msg.author.bot) continue

        const cleanContent = msg.content?.trim() || ""
        if (cleanContent.length < 4) continue

        const dup = await prisma.vouch.findFirst({
          where: {
            receiverId: userId,
            platform: "discord",
            giverId: msg.author.id,
            comment: cleanContent,
          }
        })
        if (dup) continue

        let rating = 5
        const starCount = (cleanContent.match(/⭐|🌟/g) || []).length
        if (starCount >= 1 && starCount <= 5) {
          rating = starCount
        } else {
          const matchFraction = cleanContent.match(/([1-5])\/5/)
          if (matchFraction) {
            rating = parseInt(matchFraction[1])
          }
        }

        let proofUrl = null
        const firstAttachment = msg.attachments.first()
        if (firstAttachment) {
          try {
            const ext = firstAttachment.name.split(".").pop() || "png"
            const key = proofKey("discord", ext)
            proofUrl = await persistProofToR2(firstAttachment.url, key, firstAttachment.contentType || "image/png")
          } catch (err) {
            console.error("Failed to upload import attachment:", err)
          }
        }

        await prisma.vouch.create({
          data: {
            receiverId: userId,
            platform: "discord",
            giverId: msg.author.id,
            giverName: msg.author.username,
            sourceId: interaction.guildId || "DM",
            sourceName: interaction.guild?.name ?? null,
            rating,
            comment: cleanContent,
            proofImageUrl: proofUrl,
            createdAt: msg.createdAt,
          }
        })
        importedCount++
      }

      if (interaction.guildId) {
        await updatePinnedLiveCard(interaction.client, userId, interaction.guildId)
      }

      return interaction.editReply({
        content: `✅ Successfully imported **${importedCount}** vouches from this channel's history!`,
      })
    } catch (err: any) {
      console.error("Import failed:", err)
      return interaction.editReply({
        content: `❌ Import failed: ${err.message}`,
      })
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
      const config = await getActiveConfig(receiverId, interaction.guildId)
      if (!config) {
        pendingDiscordVouches.delete(pendingId)
        return interaction.update({
          content: "❌ Seller profile not found.",
          embeds: [],
          components: [],
        })
      }

      // Re-run validation rules to prevent race conditions
      try {
        await validateVouchRules({
          receiverId,
          giverId: interaction.user.id,
          platform: "discord",
          comment,
          guildId: interaction.guildId,
          giverCreatedAt: interaction.user.createdAt,
        })
      } catch (err: any) {
        pendingDiscordVouches.delete(pendingId)
        return interaction.update({
          content: `❌ Validation failed: ${err.message}`,
          embeds: [],
          components: [],
        })
      }

      const totalVouches = await prisma.vouch.count({
        where: { receiverId, status: "ACTIVE" },
      })

      // Check premium vouch limit
      if (!config.isPremium && totalVouches >= FREE_VOUCH_LIMIT) {
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

      // Premium: Role rewards
      if (config.isPremium && config.vouchRoleId && interaction.guild) {
        try {
          const member = await interaction.guild.members.fetch(interaction.user.id)
          if (member) {
            await member.roles.add(config.vouchRoleId)
          }
        } catch (roleErr) {
          console.error("Failed to assign role reward to vouch giver:", roleErr)
        }
      }

      // Generate permalink
      const baseUrl = process.env.AUTH_URL || "https://vouched.to"
      const permalink = config.slug ? `${baseUrl}/u/${config.slug}#vouch-${createdVouch.id}` : null

      // Build Embed
      const stars = "⭐".repeat(rating)
      const embed = new EmbedBuilder()
        .setTitle(config.vouchEmbedTitle)
        .setColor(config.vouchEmbedColor as any)
        .setFooter({ text: `${config.vouchEmbedFooter} • ID: ${createdVouch.id}` })
        .setTimestamp()
        .addFields({ name: "Vouch:", value: comment }, { name: "Rating:", value: stars, inline: true })

      if (permalink) {
        embed.setURL(permalink)
      }

      if (config.vouchShowCount) {
        embed.addFields({
          name: "Vouch Nº:",
          value: `${totalVouches + 1}`,
          inline: true,
        })
      }

      if (config.vouchTagUser) {
        embed.addFields({ name: "Vouched by:", value: `<@${interaction.user.id}>`, inline: true })
      }

      // Handle Custom Channel/Role/Emoji for Premium
      let responseContent = "✅ **Vouch Recorded!**"
      if (config.isPremium && config.vouchEmoji) {
        responseContent = `${config.vouchEmoji} **Vouch Recorded!**`
      }

      const roleMention = config.isPremium && config.vouchRoleId ? `<@&${config.vouchRoleId}>` : ""
      const roleAllowedMentions = roleMention ? { roles: [config.vouchRoleId!] } : undefined

      let announcedToChannel = false
      const profileRow = new ActionRowBuilder<ButtonBuilder>()
      if (permalink) {
        profileRow.addComponents(
          new ButtonBuilder()
            .setLabel("🌐 View Profile")
            .setStyle(ButtonStyle.Link)
            .setURL(`${baseUrl}/u/${config.slug}`)
        )
      }

      if (config.isPremium && config.vouchChannelId) {
        try {
          const channel = await interaction.client.channels.fetch(config.vouchChannelId)
          if (channel && channel.isTextBased()) {
            await (channel as any).send({
              content: roleMention || undefined,
              embeds: [embed],
              components: permalink ? [profileRow] : [],
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
            components: permalink ? [profileRow] : [],
            allowedMentions: roleAllowedMentions,
          })
        }
      }

      // Trigger pinned live card update
      if (interaction.guildId) {
        await updatePinnedLiveCard(interaction.client, botUserId, interaction.guildId)
      }

      // Phase 3: Owner DM
      if (config.discordId) {
        try {
          const ownerUser = await interaction.client.users.fetch(config.discordId)
          if (ownerUser) {
            const dmEmbed = new EmbedBuilder()
              .setTitle("🔔 New Vouch Received!")
              .setColor("#10B981")
              .setDescription(`You received a new vouch from **${interaction.user.username}**!`)
              .addFields(
                { name: "Rating:", value: "⭐".repeat(rating), inline: true },
                { name: "Comment:", value: comment }
              )
              .setFooter({ text: `Vouch ID: ${createdVouch.id}` })
              .setTimestamp()
            await ownerUser.send({ embeds: [dmEmbed] })
          }
        } catch (dmErr) {
          console.error("Failed to DM owner about new vouch in Discord:", dmErr)
        }
      }

      // Phase 3: Milestone Announcement
      if (isMilestone(totalVouches + 1)) {
        const milestoneEmbed = new EmbedBuilder()
          .setTitle("🎉 Vouch Milestone Reached!")
          .setColor("#3B82F6")
          .setDescription(`🚀 **${config.name || config.username || "Seller"}** has reached **${totalVouches + 1}** verified vouches!`)
          .setFooter({ text: "Verify all reviews on Vouched.to" })

        const destChannels = []
        destChannels.push(interaction.channel)
        if (config.isPremium && config.vouchChannelId && config.vouchChannelId !== interaction.channelId) {
          try {
            const ch = await interaction.client.channels.fetch(config.vouchChannelId)
            if (ch && ch.isTextBased()) destChannels.push(ch)
          } catch {}
        }
        for (const ch of destChannels) {
          if (ch) {
            try {
              await (ch as any).send({ embeds: [milestoneEmbed] })
            } catch (err) {
              console.error("Failed to post milestone to channel:", err)
            }
          }
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

export async function updatePinnedLiveCard(
  client: Client,
  userId: string,
  guildId: string,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { vouchesReceived: true } },
        vouchesReceived: { select: { rating: true } },
      },
    })
    if (!user) return

    const isPremium = hasActivePremium(user)
    if (!isPremium) return // premium-gated

    const guildConfig = await prisma.guildConfig.findUnique({
      where: { userId_guildId: { userId, guildId } },
    })
    if (!guildConfig || !guildConfig.vouchChannelId) return

    const channelId = guildConfig.vouchChannelId
    const channel = await client.channels.fetch(channelId)
    if (!channel || !channel.isTextBased()) return

    const count = user._count.vouchesReceived
    const totalRating = user.vouchesReceived.reduce((acc, v) => acc + v.rating, 0)
    const averageRating = count > 0 ? (totalRating / count).toFixed(1) : "0.0"

    const stars = "⭐".repeat(Math.round(parseFloat(averageRating))) || "⭐"

    // Build the stats embed
    const embed = new EmbedBuilder()
      .setTitle(`📈 ${user.name || user.username}'s Reputation Live Stats`)
      .setColor((user.vouchEmbedColor as any) || "#6366f1")
      .setDescription(user.profileMetaDescription || "Real-time reputation stats. Click the buttons below to interact!")
      .addFields(
        { name: "Rating:", value: `${stars} (${averageRating} / 5.0)`, inline: true },
        { name: "Total Reviews:", value: `📝 ${count}`, inline: true }
      )
      .setFooter({ text: "Auto-updates in real-time • Powered by Vouched.to" })
      .setTimestamp()

    const baseUrl = process.env.AUTH_URL || "https://vouched.to"
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("vouch_btn")
        .setLabel("⭐ Leave a Vouch")
        .setStyle(ButtonStyle.Success)
    )

    if (user.slug) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel("🌐 View Profile")
          .setStyle(ButtonStyle.Link)
          .setURL(`${baseUrl}/u/${user.slug}`)
      )
    }

    let existingMsg = null
    if (guildConfig.pinnedMessageId) {
      try {
        existingMsg = await (channel as any).messages.fetch(guildConfig.pinnedMessageId)
      } catch (err) {
        // Message was probably deleted
      }
    }

    if (existingMsg) {
      await existingMsg.edit({
        embeds: [embed],
        components: [row],
      })
    } else {
      const newMsg = await (channel as any).send({
        embeds: [embed],
        components: [row],
      })

      try {
        await newMsg.pin()
        // Try to delete the system "pinned a message" notification
        const messages = await (channel as any).messages.fetch({ limit: 5 })
        const systemPinMsg = messages.find(
          (m: any) => m.type === 6 || m.type === "ChannelPinnedMessage"
        )
        if (systemPinMsg) {
          await systemPinMsg.delete()
        }
      } catch (pinErr) {
        console.error("Failed to pin message or delete system notification:", pinErr)
      }

      await prisma.guildConfig.update({
        where: { userId_guildId: { userId, guildId } },
        data: { pinnedMessageId: newMsg.id },
      })
    }
  } catch (err) {
    console.error("Error updating pinned live card:", err)
  }
}

