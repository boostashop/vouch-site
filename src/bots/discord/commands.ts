import { SlashCommandBuilder, REST, Routes } from "discord.js"

export function buildDiscordCommands() {
  return [
    new SlashCommandBuilder()
      .setName("vouch")
      .setDescription("Leave a vouch for this user")
      .addIntegerOption((opt) =>
        opt
          .setName("rating")
          .setDescription("Rating from 1 to 5")
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(5),
      )
      .addStringOption((opt) =>
        opt.setName("comment").setDescription("Your feedback").setRequired(false),
      )
      .addAttachmentOption((opt) =>
        opt.setName("proof").setDescription("Upload a screenshot as proof").setRequired(false),
      )
      .toJSON(),
    new SlashCommandBuilder().setName("stats").setDescription("View vouch statistics").toJSON(),
    new SlashCommandBuilder()
      .setName("restore")
      .setDescription("Restore all vouches to this channel (Owner only)")
      .toJSON(),
    new SlashCommandBuilder().setName("help").setDescription("How to use this vouch bot").toJSON(),
    new SlashCommandBuilder()
      .setName("blacklist")
      .setDescription("Manage seller blacklist (Owner only)")
      .addSubcommand((sub) =>
        sub
          .setName("add")
          .setDescription("Add a user to the blacklist")
          .addStringOption((opt) =>
            opt.setName("user_id").setDescription("Platform User ID to blacklist").setRequired(true),
          )
          .addStringOption((opt) =>
            opt.setName("reason").setDescription("Reason for blacklist").setRequired(false),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("remove")
          .setDescription("Remove a user from the blacklist")
          .addStringOption((opt) =>
            opt.setName("user_id").setDescription("Platform User ID to remove").setRequired(true),
          ),
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("report")
      .setDescription("Report a vouch for moderation")
      .addStringOption((opt) =>
        opt.setName("vouch_id").setDescription("ID of the vouch to report").setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName("reason").setDescription("Reason for reporting").setRequired(false),
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("moderate")
      .setDescription("Manage reported vouches (Owner only)")
      .addSubcommand((sub) =>
        sub.setName("list").setDescription("List all pending reports"),
      )
      .addSubcommand((sub) =>
        sub
          .setName("approve")
          .setDescription("Approve a vouch (marks active and clears reports)")
          .addStringOption((opt) =>
            opt.setName("vouch_id").setDescription("ID of the vouch to approve").setRequired(true),
          ),
      )
      .addSubcommand((sub) =>
        sub
          .setName("remove")
          .setDescription("Remove a vouch (soft-delete)")
          .addStringOption((opt) =>
            opt.setName("vouch_id").setDescription("ID of the vouch to remove").setRequired(true),
          ),
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("profile")
      .setDescription("View a Vouched.to seller profile card")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("User to look up (defaults to bot owner)").setRequired(false),
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("Show the top sellers by vouch count")
      .addStringOption((opt) =>
        opt
          .setName("scope")
          .setDescription("Scope of the leaderboard (server or global)")
          .setRequired(false)
          .addChoices({ name: "Server", value: "server" }, { name: "Global", value: "global" }),
      )
      .toJSON(),
    new SlashCommandBuilder().setName("recent").setDescription("Show recent vouches for this seller").toJSON(),
    new SlashCommandBuilder()
      .setName("find")
      .setDescription("Search for vouches by comment keyword or rating")
      .addStringOption((opt) =>
        opt.setName("query").setDescription("Keyword or rating (1-5) to search for").setRequired(true),
      )
      .toJSON(),
  ]
}

export async function registerDiscordCommands(token: string, botId: string) {
  const rest = new REST({ version: "10" }).setToken(token)
  try {
    console.log(`Started refreshing application (/) commands for bot ${botId}.`)
    await rest.put(Routes.applicationCommands(botId), { body: buildDiscordCommands() })
    console.log(`Successfully reloaded application (/) commands for bot ${botId}.`)
  } catch (err) {
    console.error(`Error registering Discord commands for bot ${botId}:`, err)
  }
}
