import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  CacheType
} from 'discord.js';
import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { uploadToR2 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Multi-tenant manager to keep track of active bot instances
class BotManager {
  private discordClients: Map<string, Client> = new Map();
  private telegramBots: Map<string, Telegraf> = new Map();

  async start() {
    console.log('Starting Bot Manager Service...');
    
    // Initial sync
    await this.syncBots();

    // Poll for new tokens every 60 seconds (or use a DB trigger/event in a real prod env)
    setInterval(() => this.syncBots(), 60000);
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
      // Discord Sync
      if (user.discordBotToken && !this.discordClients.has(user.id)) {
        await this.spawnDiscordBot(user.id, user.discordBotToken);
      }

      // Telegram Sync
      if (user.telegramBotToken && !this.telegramBots.has(user.id)) {
        await this.spawnTelegramBot(user.id, user.telegramBotToken);
      }
    }
  }

  // --- DISCORD LOGIC ---

  async spawnDiscordBot(userId: string, token: string) {
    console.log(`Spawning Discord bot for User ID: ${userId}`);
    
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ],
      // Optimization: Limit cache to keep RAM usage low
      makeCache: (manager) => {
        // Disable unnecessary caches
        const disabled = [
          'MessageManager',
          'GuildMemberManager',
          'UserManager',
          'PresenceManager',
          'ThreadManager',
          'GuildEmojiManager',
          'GuildStickerManager',
          'GuildScheduledEventManager',
          'ReactionManager',
          'ReactionUserManager',
          'VoiceStateManager'
        ];
        if (disabled.includes(manager.name)) {
          return new Map(); // Return a dummy map to disable caching
        }
        // @ts-expect-error - discord.js type definitions are sometimes incomplete for internal managers
        return manager.constructor.defaultMakeCache()(manager);
      }
    });

    try {
      await client.login(token);
      this.discordClients.set(userId, client);
      
      // Register Commands
      await this.registerDiscordCommands(token, client.user!.id);

      client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        await this.handleDiscordInteraction(interaction, userId);
      });

      console.log(`Discord Bot for ${userId} is online as ${client.user?.tag}`);
    } catch (error) {
      console.error(`Failed to start Discord bot for ${userId}:`, error);
    }
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
      await rest.put(Routes.applicationCommands(botId), { body: commands });
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
          include: { _count: { select: { vouchesReceived: true } } }
        });

        if (!user) {
          return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        }

        if (!user.isPremium && user._count.vouchesReceived >= 50) {
          return interaction.reply({ 
            content: '❌ This user has reached the maximum limit of 50 vouches for free accounts. They need to upgrade to Premium to receive more.',
            ephemeral: true 
          });
        }

        let proofUrl = proof?.url || null;

        if (proof) {
          try {
            const response = await fetch(proof.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileExtension = proof.name.split('.').pop() || 'png';
            const key = `proofs/${uuidv4()}.${fileExtension}`;
            
            // Only attempt upload if R2 is configured
            if (process.env.R2_ENDPOINT) {
              proofUrl = await uploadToR2(buffer, key, proof.contentType || 'image/png');
            }
          } catch (uploadErr) {
            console.error('Failed to upload proof to R2:', uploadErr);
            // Fallback to Discord URL if upload fails
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

        await interaction.reply({
          content: `✅ **Vouch Recorded!** Thank you for your feedback, ${interaction.user.username}.`,
          ephemeral: true
        });
      } catch (err) {
        console.error('Error saving vouch:', err);
        await interaction.reply({ content: '❌ Failed to save vouch. Please try again later.', ephemeral: true });
      }
    }

    if (interaction.commandName === 'stats') {
       const count = await prisma.vouch.count({ where: { receiverId: userId } });
       await interaction.reply({
         content: `📊 **Vouch Stats:** This user has collected **${count}** vouches!`,
       });
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

  async spawnTelegramBot(userId: string, token: string) {
    console.log(`Spawning Telegram bot for User ID: ${userId}`);
    
    const bot = new Telegraf(token);

    bot.command('start', async (ctx) => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { telegramId: ctx.from.id.toString() }
        });
        await ctx.reply('🚀 **VouchSite Bot is linked!**\n\nYour Telegram account is now connected to your dashboard. You can use /vouch <rating> <comment> to collect feedback and /restore to re-post your vouches.', { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Failed to link Telegram ID:', err);
        await ctx.reply('❌ Failed to link your account. Please try again.');
      }
    });

    bot.command('vouch', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length < 2) {
        return ctx.reply('❌ Usage: /vouch <rating:1-5> <comment>');
      }

      const rating = parseInt(args[0]);
      const comment = args.slice(1).join(' ');

      if (isNaN(rating) || rating < 1 || rating > 5) {
        return ctx.reply('❌ Rating must be a number between 1 and 5.');
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { _count: { select: { vouchesReceived: true } } }
        });

        if (!user) return ctx.reply('❌ User not found.');

        if (!user.isPremium && user._count.vouchesReceived >= 50) {
          return ctx.reply('❌ Vouch limit (50) reached for this account.');
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

        await ctx.reply(`✅ **Vouch Recorded!** Thanks, ${ctx.from.first_name}.`);
      } catch (err) {
        console.error('Error saving Telegram vouch:', err);
        await ctx.reply('❌ Failed to save vouch.');
      }
    });

    bot.command('stats', async (ctx) => {
      const count = await prisma.vouch.count({ where: { receiverId: userId } });
      await ctx.reply(`📊 **Vouch Stats:** This user has **${count}** vouches!`);
    });

    bot.command('restore', async (ctx) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.telegramId !== ctx.from.id.toString()) {
        return ctx.reply('❌ Only the owner can use this command.');
      }

      await ctx.reply('⏳ Starting restoration...');

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
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      await ctx.reply('✅ Restoration complete!');
    });

    try {
      bot.launch();
      this.telegramBots.set(userId, bot);
      console.log(`Telegram Bot for ${userId} is online.`);
    } catch (error) {
      console.error(`Failed to start Telegram bot for ${userId}:`, error);
    }

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
}

const manager = new BotManager();
manager.start();
