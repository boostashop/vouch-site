import {
  Client,
  GatewayIntentBits,
  Options,
  EmbedBuilder,
  ChatInputCommandInteraction,
  CacheType,
} from "discord.js"
import { prisma } from "../prisma"
import {
  hasActivePremium,
  persistProofToR2,
  getLeaderboardRank,
  proofKey,
  FREE_VOUCH_LIMIT,
} from "../vouch-service"
import { registerDiscordCommands } from "./commands"

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
    if (!interaction.isChatInputCommand()) return
    console.log(
      `[Interaction] Received ${interaction.commandName} (ID: ${interaction.id}) from ${interaction.user.tag} for User ${userId}`,
    )
    await handleDiscordInteraction(interaction, userId)
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
        { name: "/restore", value: "Owner only — re-post the full vouch history into this channel." },
      )
      .setFooter({ text: "Powered by Vouched.to" })
    return interaction.reply({ embeds: [embed], ephemeral: true })
  }

  if (interaction.commandName === "vouch") {
    const rating = interaction.options.getInteger("rating", true)
    const comment = interaction.options.getString("comment", true)
    const proof = interaction.options.getAttachment("proof")

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

      await prisma.vouch.create({
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

      // Build Custom Embed
      const stars = "⭐".repeat(rating)
      const embed = new EmbedBuilder()
        .setTitle(user.vouchEmbedTitle)
        .setColor(user.vouchEmbedColor as any)
        .setFooter({ text: user.vouchEmbedFooter })
        .setTimestamp()
        .addFields({ name: "Vouch:", value: comment }, { name: "Rating:", value: stars, inline: true })

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

      await interaction.reply({ embeds: [embed] })
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
}
