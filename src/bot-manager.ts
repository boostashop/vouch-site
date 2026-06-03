import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  CacheType,
  Options,
  EmbedBuilder
} from 'discord.js';
import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { uploadToR2 } from './lib/s3';
import { hasActivePremium } from './lib/premium';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Persist a remote proof image to R2 and return its public URL, or null if R2
// isn't configured or the upload fails. We deliberately never fall back to the
// source URL: Discord CDN links are short-lived, and Telegram file links embed
// the bot token (`/file/bot<TOKEN>/…`) — storing either would break the image or
// leak the token on the public profile.
async function persistProofToR2(sourceUrl: string, key: string, contentType: string): Promise<string | null> {
  if (!process.env.R2_ENDPOINT) return null;
  try {
    const response = await fetch(sourceUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return await uploadToR2(buffer, key, contentType);
  } catch (err) {
    console.error('Failed to persist proof to R2:', err);
    return null;
  }
}

// After a spawn fails for a given token, wait this long before retrying that
// same token — otherwise a bad/revoked token gets retried every poll (60s) and
// can get the IP rate-limited or banned by Discord/Telegram. A token change
// bypasses the backoff immediately.
const SPAWN_RETRY_BACKOFF_MS = 5 * 60 * 1000;

// Multi-tenant manager to keep track of active bot instances. We remember the
// token each client was spawned with so we can detect dashboard edits and
// respawn with the new token.
class BotManager {
  private discordClients: Map<string, { client: Client; token: string }> = new Map();
  private telegramBots: Map<string, { bot: Telegraf; token: string }> = new Map();
  private failedSpawns: Map<string, { token: string; at: number }> = new Map();

  async start() {
    console.log('Starting Bot Manager Service...');
    
    // Initial sync
    await this.syncBots();

    // Poll for new tokens every 60 seconds (or use a DB trigger/event in a real prod env)
    const interval = setInterval(() => this.syncBots(), 60000);

    // Enable graceful stop
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down Bot Manager...`);
      clearInterval(interval);
      
      for (const [userId, { client }] of this.discordClients) {
        console.log(`Destroying Discord client for ${userId}`);
        client.destroy();
      }

      for (const [userId, { bot }] of this.telegramBots) {
        console.log(`Stopping Telegram bot for ${userId}`);
        bot.stop(signal);
      }
      
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }

  async syncBots() {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { discordBotToken: { not: null } },
          { telegramBotToken: { not: null } }
        ]
      }
    });

    for (const user of users) {
      // --- Discord Sync ---
      const discordKey = `discord:${user.id}`;
      const existingDiscord = this.discordClients.get(user.id);
      if (user.discordBotToken) {
        // Token replaced in the dashboard → tear down the stale client so we
        // respawn with the new one below.
        if (existingDiscord && existingDiscord.token !== user.discordBotToken) {
          console.log(`Discord token changed for ${user.id}; respawning.`);
          existingDiscord.client.destroy();
          this.discordClients.delete(user.id);
        }
        if (!this.discordClients.has(user.id) && this.shouldAttemptSpawn(discordKey, user.discordBotToken)) {
          const ok = await this.spawnDiscordBot(user.id, user.discordBotToken);
          if (ok) this.failedSpawns.delete(discordKey);
          else this.failedSpawns.set(discordKey, { token: user.discordBotToken, at: Date.now() });
        }
      } else if (existingDiscord) {
        console.log(`Stopping Discord bot for ${user.id} (token removed)`);
        existingDiscord.client.destroy();
        this.discordClients.delete(user.id);
        this.failedSpawns.delete(discordKey);
      }

      // --- Telegram Sync ---
      const telegramKey = `telegram:${user.id}`;
      const existingTelegram = this.telegramBots.get(user.id);
      if (user.telegramBotToken) {
        if (existingTelegram && existingTelegram.token !== user.telegramBotToken) {
          console.log(`Telegram token changed for ${user.id}; respawning.`);
          existingTelegram.bot.stop('SIGTERM');
          this.telegramBots.delete(user.id);
        }
        if (!this.telegramBots.has(user.id) && this.shouldAttemptSpawn(telegramKey, user.telegramBotToken)) {
          const ok = await this.spawnTelegramBot(user.id, user.telegramBotToken);
          if (ok) this.failedSpawns.delete(telegramKey);
          else this.failedSpawns.set(telegramKey, { token: user.telegramBotToken, at: Date.now() });
        }
      } else if (existingTelegram) {
        console.log(`Stopping Telegram bot for ${user.id} (token removed)`);
        existingTelegram.bot.stop('SIGTERM');
        this.telegramBots.delete(user.id);
        this.failedSpawns.delete(telegramKey);
      }
    }
  }

  // Skip respawning a token that just failed, unless the token has since changed
  // or the backoff window has elapsed — prevents hammering Discord/Telegram with
  // a known-bad token on every poll.
  private shouldAttemptSpawn(key: string, token: string): boolean {
    const failed = this.failedSpawns.get(key);
    if (!failed) return true;
    if (failed.token !== token) return true;
    return Date.now() - failed.at > SPAWN_RETRY_BACKOFF_MS;
  }

  // --- DISCORD LOGIC ---

  async spawnDiscordBot(userId: string, token: string): Promise<boolean> {
    console.log(`Spawning Discord bot for User ID: ${userId}`);

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ],
      // Optimization: Limit cache to keep RAM usage low
      makeCache: Options.cacheWithLimits({
        MessageManager: 0,
        PresenceManager: 0,
        ThreadManager: 0,
        ReactionManager: 0,
        GuildMemberManager: 0,
        UserManager: 0,
      }),
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      console.log(`[Interaction] Received ${interaction.commandName} (ID: ${interaction.id}) from ${interaction.user.tag} for User ${userId}`);
      await this.handleDiscordInteraction(interaction, userId);
    });

    try {
      await client.login(token);
    } catch (error) {
      console.error(`Failed to start Discord bot for ${userId}:`, error);
      try { client.destroy(); } catch {}
      return false;
    }

    this.discordClients.set(userId, { client, token });
    await this.registerDiscordCommands(token, client.user!.id);
    console.log(`Discord Bot for ${userId} is online as ${client.user?.tag}`);
    return true;
  }

  async registerDiscordCommands(token: string, botId: string) {
    const commands = [
      new SlashCommandBuilder()
        .setName('vouch')
        .setDescription('Leave a vouch for this user')
        .addIntegerOption(opt => 
          opt.setName('rating')
             .setDescription('Rating from 1 to 5')
             .setRequired(true)
             .setMinValue(1)
             .setMaxValue(5))
        .addStringOption(opt => 
          opt.setName('comment')
             .setDescription('Your feedback')
             .setRequired(true))
        .addAttachmentOption(opt =>
          opt.setName('proof')
             .setDescription('Upload a screenshot as proof')
             .setRequired(false))
        .toJSON(),
      new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View vouch statistics')
        .toJSON(),
      new SlashCommandBuilder()
        .setName('restore')
        .setDescription('Restore all vouches to this channel (Owner only)')
        .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(token);
    try {
      console.log(`Started refreshing application (/) commands for bot ${botId}.`);
      await rest.put(Routes.applicationCommands(botId), { body: commands });
      console.log(`Successfully reloaded application (/) commands for bot ${botId}.`);
    } catch (err) {
      console.error(`Error registering Discord commands for bot ${botId}:`, err);
    }
  }

  async handleDiscordInteraction(interaction: ChatInputCommandInteraction<CacheType>, userId: string) {
    if (interaction.commandName === 'vouch') {
      const rating = interaction.options.getInteger('rating', true);
      const comment = interaction.options.getString('comment', true);
      const proof = interaction.options.getAttachment('proof');

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { 
            _count: { select: { vouchesReceived: true } }
          }
        });

        if (!user) {
          return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        }

        const premium = hasActivePremium(user);

        if (!premium && user._count.vouchesReceived >= 50) {
          return interaction.reply({ 
            content: '❌ This user has reached the maximum limit of 50 vouches for free accounts. They need to upgrade to Premium to receive more.',
            ephemeral: true 
          });
        }

        if (user.vouchRequireProof && !proof) {
          return interaction.reply({ content: '❌ This user requires proof (screenshot) for every vouch.', ephemeral: true });
        }

        let proofUrl: string | null = null;

        if (proof) {
          const fileExtension = proof.name.split('.').pop() || 'png';
          const key = `proofs/${uuidv4()}.${fileExtension}`;
          proofUrl = await persistProofToR2(proof.url, key, proof.contentType || 'image/png');

          // If proof is mandatory but we couldn't store it, don't save a
          // proofless vouch — ask them to retry rather than silently dropping it.
          if (user.vouchRequireProof && !proofUrl) {
            return interaction.reply({ content: '❌ Could not save your proof image right now (storage unavailable). Please try again later.', ephemeral: true });
          }
        }

        await prisma.vouch.create({
          data: {
            receiverId: userId,
            platform: 'discord',
            giverId: interaction.user.id,
            giverName: interaction.user.username,
            sourceId: interaction.guildId || 'DM',
            rating,
            comment,
            proofImageUrl: proofUrl,
            createdAt: new Date()
          }
        });

        // Build Custom Embed
        const stars = '⭐'.repeat(rating);
        const embed = new EmbedBuilder()
          .setTitle(user.vouchEmbedTitle)
          .setColor(user.vouchEmbedColor as any)
          .setFooter({ text: user.vouchEmbedFooter })
          .setTimestamp()
          .addFields(
            { name: 'Vouch:', value: comment },
            { name: 'Rating:', value: stars, inline: true }
          );

        if (user.vouchShowCount) {
          embed.addFields({ name: 'Vouch Nº:', value: `${user._count.vouchesReceived + 1}`, inline: true });
        }

        if (user.vouchTagUser) {
          embed.addFields({ name: 'Vouched by:', value: `<@${interaction.user.id}>`, inline: true });
        }

        if (proofUrl) {
          embed.setImage(proofUrl);
        }

        // Handle Custom Channel/Role/Emoji for Premium
        let responseContent = '✅ **Vouch Recorded!**';
        if (premium && user.vouchEmoji) {
          responseContent = `${user.vouchEmoji} **Vouch Recorded!**`;
        }

        // If a specific channel is set and user is premium, send there too
        if (premium && user.vouchChannelId) {
          try {
            const channel = await interaction.client.channels.fetch(user.vouchChannelId);
            if (channel && channel.isTextBased()) {
              await (channel as any).send({ embeds: [embed] });
            }
          } catch (err) {
            console.error('Failed to send vouch to custom channel:', err);
          }
        }

        await interaction.reply({
          content: responseContent,
          embeds: [embed],
          ephemeral: false
        });

      } catch (err) {
        console.error('Error saving vouch:', err);
        await interaction.reply({ content: '❌ Failed to save vouch. Please try again later.', ephemeral: true });
      }
    }

    if (interaction.commandName === 'stats') {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { 
            _count: { select: { vouchesReceived: true } },
            vouchesReceived: { select: { rating: true } }
          }
        });

        if (!user) {
          return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        }

        const count = user._count.vouchesReceived;
        const totalRating = user.vouchesReceived.reduce((acc, v) => acc + v.rating, 0);
        const averageRating = count > 0 ? (totalRating / count).toFixed(1) : '0.0';

        const embed = new EmbedBuilder()
          .setTitle(user.statsEmbedTitle)
          .setDescription(user.statsEmbedDescription)
          .setColor(user.statsEmbedColor as any)
          .setFooter({ text: user.statsEmbedFooter })
          .setTimestamp();

        if (user.statsShowCount) {
          embed.addFields({ name: 'Nº Vouches:', value: `${count}`, inline: true });
        }

        if (user.statsShowScore) {
          embed.addFields({ name: 'Score:', value: `${averageRating} / 5.0`, inline: true });
        }

        if (user.statsShowPlan) {
          embed.addFields({ name: 'Plan:', value: hasActivePremium(user) ? 'Premium Plan' : 'Free Plan', inline: true });
        }

        if (user.statsShowExpiration && user.premiumExpiresAt) {
          embed.addFields({ name: 'Renews/Expires:', value: user.premiumExpiresAt.toLocaleDateString(), inline: true });
        }

        if (user.statsShowAge) {
          embed.addFields({ name: 'Member Since:', value: user.emailVerified?.toLocaleDateString() || 'N/A', inline: true });
        }

        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        console.error('Error fetching stats:', err);
        await interaction.reply({ content: '❌ Failed to fetch stats.', ephemeral: true });
      }
    }

    if (interaction.commandName === 'restore') {
      // Check if it's the owner
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.discordId !== interaction.user.id) {
        return interaction.reply({ content: '❌ Only the owner can use this command.', ephemeral: true });
      }

      await interaction.reply({ content: '⏳ Starting restoration of all vouches...', ephemeral: true });

      const vouches = await prisma.vouch.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'asc' }
      });

      const channel = interaction.channel;
      if (!channel) return;

      for (const vouch of vouches) {
        const stars = '⭐'.repeat(vouch.rating);
        const content = `**Vouch from ${vouch.giverName}**\nRating: ${stars}\nComment: ${vouch.comment}`;
        
        const messageOptions: { content: string, files?: string[] } = { content };
        if (vouch.proofImageUrl) {
          messageOptions.files = [vouch.proofImageUrl];
        }

        try {
          if (channel && 'send' in channel) {
            await (channel as any).send(messageOptions);
          }
        } catch (sendErr) {
          console.error('Failed to send message during restore:', sendErr);
        }
        
        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      await interaction.followUp({ content: '✅ Restoration complete!', ephemeral: true });
    }
  }

  // --- TELEGRAM LOGIC ---

  async spawnTelegramBot(userId: string, token: string): Promise<boolean> {
    console.log(`Spawning Telegram bot for User ID: ${userId}`);
    
    const bot = new Telegraf(token);

    // Debug: Log every single update
    bot.use((ctx, next) => {
      console.log(`[Telegram] Received update type: ${ctx.updateType} from ${ctx.from?.id}`);
      return next();
    });

    bot.command(['start', 'link'], async (ctx) => {
      console.log(`[Telegram] Received /start or /link from ${ctx.from.id} for User ${userId}`);
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { telegramId: ctx.from.id.toString() }
        });
        console.log(`[Telegram] Successfully linked ID ${ctx.from.id} to User ${userId}`);
        await ctx.reply('🚀 **Vouched.to Bot is linked!**\n\nYour Telegram account is now connected to your dashboard. You can use /vouch <rating> <comment> to collect feedback and /restore to re-post your vouches.', { parse_mode: 'Markdown' });
      } catch (err) {
        console.error(`[Telegram] Failed to link ID ${ctx.from.id} to User ${userId}:`, err);
        await ctx.reply('❌ Failed to link your account. Please try again.');
      }
    });

    bot.command('vouch', async (ctx) => {
      console.log(`[Telegram] Received /vouch from ${ctx.from.id} for User ${userId}`);
      const args = ctx.message.text.split(' ').slice(1);
      const rating = parseInt(args[0]);
      const comment = args.slice(1).join(' ');

      if (isNaN(rating) || rating < 1 || rating > 5 || !comment) {
        return ctx.reply('❌ **Usage:** `/vouch <rating:1-5> <comment>`\nExample: `/vouch 5 Great service!`', { parse_mode: 'Markdown' });
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { _count: { select: { vouchesReceived: true } } }
        });

        if (!user) return ctx.reply('❌ User not found.');

        if (!hasActivePremium(user) && user._count.vouchesReceived >= 50) {
          return ctx.reply('❌ Vouch limit (50) reached for this account. Upgrade to Premium for unlimited storage.');
        }

        if (user.vouchRequireProof) {
          return ctx.reply('❌ This user requires proof. Please send a photo with the caption: `/vouch ' + rating + ' ' + comment + '`');
        }

        await prisma.vouch.create({
          data: {
            receiverId: userId,
            platform: 'telegram',
            giverId: ctx.from.id.toString(),
            giverName: ctx.from.username || ctx.from.first_name,
            sourceId: ctx.chat.id.toString(),
            rating,
            comment,
            createdAt: new Date()
          }
        });

        const stars = '⭐'.repeat(rating);
        const responseText = `✅ **Vouch Recorded!**\n\n**Giver:** ${ctx.from.first_name}\n**Rating:** ${stars}\n**Comment:** ${comment}\n\n_${user.vouchEmbedFooter}_`;
        
        await ctx.reply(responseText, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Error saving Telegram vouch:', err);
        await ctx.reply('❌ Failed to save vouch.');
      }
    });

    // Handle photos sent with /vouch caption
    bot.on('photo', async (ctx) => {
      const caption = (ctx.message as any).caption;
      if (!caption || !caption.startsWith('/vouch')) return;

      const args = caption.split(' ').slice(1);
      const rating = parseInt(args[0]);
      const comment = args.slice(1).join(' ');

      if (isNaN(rating) || rating < 1 || rating > 5 || !comment) {
        return ctx.reply('❌ **Invalid Format.** Use: `/vouch <rating:1-5> <comment>` as the caption for your photo.', { parse_mode: 'Markdown' });
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { _count: { select: { vouchesReceived: true } } }
        });

        if (!user) return;

        if (!hasActivePremium(user) && user._count.vouchesReceived >= 50) {
          return ctx.reply('❌ Vouch limit (50) reached.');
        }

        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const fileLink = await ctx.telegram.getFileLink(photo.file_id);
        const key = `proofs/tg-${uuidv4()}.jpg`;
        const proofUrl = await persistProofToR2(fileLink.toString(), key, 'image/jpeg');

        // The photo IS the proof here, so if we can't store it, don't save a
        // "with proof" vouch — and never persist the Telegram link (it embeds
        // the bot token).
        if (!proofUrl) {
          return ctx.reply('❌ Could not save your proof image right now (storage unavailable). Please try again later.');
        }

        await prisma.vouch.create({
          data: {
            receiverId: userId,
            platform: 'telegram',
            giverId: ctx.from.id.toString(),
            giverName: ctx.from.username || ctx.from.first_name,
            sourceId: ctx.chat.id.toString(),
            rating,
            comment,
            proofImageUrl: proofUrl,
            createdAt: new Date()
          }
        });

        const stars = '⭐'.repeat(rating);
        const responseText = `✅ **Vouch Recorded with Proof!**\n\n**Giver:** ${ctx.from.first_name}\n**Rating:** ${stars}\n**Comment:** ${comment}\n\n_${user.vouchEmbedFooter}_`;
        
        await ctx.reply(responseText, { parse_mode: 'Markdown' });

      } catch (err) {
        console.error('Error saving Telegram photo vouch:', err);
        await ctx.reply('❌ Failed to save vouch with proof.');
      }
    });

    bot.command('stats', async (ctx) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { 
            _count: { select: { vouchesReceived: true } },
            vouchesReceived: { select: { rating: true } }
          }
        });

        if (!user) return ctx.reply('❌ User not found.');

        const count = user._count.vouchesReceived;
        const totalRating = user.vouchesReceived.reduce((acc, v) => acc + v.rating, 0);
        const averageRating = count > 0 ? (totalRating / count).toFixed(1) : '0.0';

        const statsText = `📊 **${user.statsEmbedTitle}**\n\n` +
          `${user.statsEmbedDescription}\n\n` +
          (user.statsShowCount ? `**Total Vouches:** ${count}\n` : '') +
          (user.statsShowScore ? `**Average Rating:** ${averageRating} / 5.0\n` : '') +
          (user.statsShowPlan ? `**Account Plan:** ${hasActivePremium(user) ? 'Premium' : 'Free'}\n` : '') +
          (user.statsShowExpiration && user.premiumExpiresAt ? `**Renews/Expires:** ${user.premiumExpiresAt.toLocaleDateString()}\n` : '') +
          `\n_${user.statsEmbedFooter}_`;

        await ctx.reply(statsText, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Error fetching Telegram stats:', err);
        await ctx.reply('❌ Failed to fetch stats.');
      }
    });

    bot.command('restore', async (ctx) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.telegramId !== ctx.from.id.toString()) {
        return ctx.reply('❌ Only the owner can use this command.');
      }

      await ctx.reply('⏳ **Starting restoration...** re-posting all vouches.', { parse_mode: 'Markdown' });

      const vouches = await prisma.vouch.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'asc' }
      });

      for (const vouch of vouches) {
        const stars = '⭐'.repeat(vouch.rating);
        const text = `**Vouch from ${vouch.giverName}**\nRating: ${stars}\nComment: ${vouch.comment}`;
        
        try {
          if (vouch.proofImageUrl) {
            await ctx.replyWithPhoto(vouch.proofImageUrl, { caption: text, parse_mode: 'Markdown' });
          } else {
            await ctx.reply(text, { parse_mode: 'Markdown' });
          }
        } catch (err) {
          console.error('Failed to restore Telegram vouch:', err);
        }
        // Slightly faster delay for Telegram
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await ctx.reply('✅ **Restoration complete!**');
    });

    // Validate the token before committing — getMe throws on a bad/revoked
    // token, which lets us report failure (and back off) instead of leaking an
    // unhandled promise rejection from launch().
    try {
      await bot.telegram.getMe();
    } catch (error) {
      console.error(`Failed to start Telegram bot for ${userId}:`, error);
      return false;
    }

    // launch() resolves only when the bot stops, so we don't await it; we just
    // catch a later crash so it doesn't become an unhandled rejection.
    bot.launch().catch((err) => console.error(`Telegram bot for ${userId} stopped:`, err));
    this.telegramBots.set(userId, { bot, token });
    console.log(`Telegram Bot for ${userId} is online.`);
    return true;
  }
}

const manager = new BotManager();
manager.start();
