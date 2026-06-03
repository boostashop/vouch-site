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
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(5),
      )
      .addStringOption((opt) =>
        opt.setName("comment").setDescription("Your feedback").setRequired(true),
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
