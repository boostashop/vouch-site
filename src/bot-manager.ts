import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  CacheType
} from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Multi-tenant manager to keep track of active bot instances
class BotManager {
  private clients: Map<string, Client> = new Map();

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
        discordBotToken: { not: null }
      }
    });

    for (const user of users) {
      if (!user.discordBotToken) continue;
      
      if (!this.clients.has(user.id)) {
        await this.spawnBot(user.id, user.discordBotToken);
      }
    }
  }

  async spawnBot(userId: string, token: string) {
    console.log(`Spawning bot for User ID: ${userId}`);
    
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    try {
      await client.login(token);
      this.clients.set(userId, client);
      
      // Register Commands
      await this.registerCommands(token, client.user!.id);

      client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        await this.handleInteraction(interaction, userId);
      });

      console.log(`Bot for ${userId} is online as ${client.user?.tag}`);
    } catch (error) {
      console.error(`Failed to start bot for ${userId}:`, error);
    }
  }

  async registerCommands(token: string, botId: string) {
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
        .toJSON(),
      new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View vouch statistics')
        .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(token);
    try {
      await rest.put(Routes.applicationCommands(botId), { body: commands });
    } catch (err) {
      console.error(`Error registering commands for bot ${botId}:`, err);
    }
  }

  async handleInteraction(interaction: ChatInputCommandInteraction<CacheType>, userId: string) {
    if (interaction.commandName === 'vouch') {
      const rating = interaction.options.getInteger('rating', true);
      const comment = interaction.options.getString('comment', true);

      try {
        await prisma.vouch.create({
          data: {
            receiverId: userId,
            platform: 'discord',
            giverId: interaction.user.id,
            giverName: interaction.user.username,
            sourceId: interaction.guildId || 'DM',
            rating,
            comment,
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
  }
}

const manager = new BotManager();
manager.start();
