"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { encryptSecret, decryptSecret } from "@/lib/crypto"

export async function updateBotTokens(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Tokens are never echoed back to the client, so we can't treat a blank field
  // as "clear" — that would wipe the token every save. Only fields that are
  // present in *this* submission and non-empty are written; a blank field means
  // "leave unchanged". (Each tab submits only its own field, so this also stops
  // saving Discord from nulling the Telegram token and vice versa.) Use the
  // explicit disconnect action to remove a token.
  const data: { discordBotToken?: string; telegramBotToken?: string } = {}

  if (formData.has("discordToken")) {
    const v = (formData.get("discordToken") as string).trim()
    if (v) data.discordBotToken = encryptSecret(v)
  }
  if (formData.has("telegramToken")) {
    const v = (formData.get("telegramToken") as string).trim()
    if (v) data.telegramBotToken = encryptSecret(v)
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: session.user.id }, data })
  }

  revalidatePath("/dashboard/bot")
}

export async function removeBotToken(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const platform = formData.get("platform")
  if (platform === "discord") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { discordBotToken: null },
    })
  } else if (platform === "telegram") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { telegramBotToken: null },
    })
  }

  revalidatePath("/dashboard/bot")
}

export async function updateVouchSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const vouchEmbedTitle = formData.get("vouchEmbedTitle") as string
  const vouchEmbedFooter = formData.get("vouchEmbedFooter") as string
  const vouchEmbedColor = formData.get("vouchEmbedColor") as string
  const vouchRequireProof = formData.get("vouchRequireProof") === "on"
  const vouchShowCount = formData.get("vouchShowCount") === "on"
  const vouchTagUser = formData.get("vouchTagUser") === "on"
  const vouchChannelId = formData.get("vouchChannelId") as string
  const vouchRoleId = formData.get("vouchRoleId") as string
  const vouchEmoji = formData.get("vouchEmoji") as string
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      vouchEmbedTitle,
      vouchEmbedFooter,
      vouchEmbedColor,
      vouchRequireProof,
      vouchShowCount,
      vouchTagUser,
      vouchChannelId: vouchChannelId || null,
      vouchRoleId: vouchRoleId || null,
      vouchEmoji: vouchEmoji || null,
    }
  })
  
  revalidatePath("/dashboard/bot")
}

export async function updateStatsSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const statsEmbedTitle = formData.get("statsEmbedTitle") as string
  const statsEmbedDescription = formData.get("statsEmbedDescription") as string
  const statsEmbedFooter = formData.get("statsEmbedFooter") as string
  const statsEmbedColor = formData.get("statsEmbedColor") as string
  const statsShowCount = formData.get("statsShowCount") === "on"
  const statsShowScore = formData.get("statsShowScore") === "on"
  const statsShowLeaderboard = formData.get("statsShowLeaderboard") === "on"
  const statsShowPlan = formData.get("statsShowPlan") === "on"
  const statsShowExpiration = formData.get("statsShowExpiration") === "on"
  const statsShowAge = formData.get("statsShowAge") === "on"
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      statsEmbedTitle,
      statsEmbedDescription,
      statsEmbedFooter,
      statsEmbedColor,
      statsShowCount,
      statsShowScore,
      statsShowLeaderboard,
      statsShowPlan,
      statsShowExpiration,
      statsShowAge,
    }
  })
  
  revalidatePath("/dashboard/bot")
}

export async function getBotGuildChannels(guildId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user || !user.discordBotToken) throw new Error("Bot not configured")

  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${decryptSecret(user.discordBotToken)}`
      }
    })
    if (!response.ok) {
      throw new Error("Failed to fetch channels")
    }
    const channels = await response.json()
    // Filter for text channels (type 0) and sort by name
    return channels
      .filter((c: any) => c.type === 0)
      .map((c: any) => ({ id: c.id, name: c.name }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error("Error fetching channels:", err)
    return []
  }
}

export async function getBotGuildRoles(guildId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user || !user.discordBotToken) throw new Error("Bot not configured")

  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${decryptSecret(user.discordBotToken)}`
      }
    })
    if (!response.ok) {
      throw new Error("Failed to fetch roles")
    }
    const roles = await response.json()
    // Filter out @everyone (role ID == guild ID) and managed roles, then sort by name
    return roles
      .filter((r: any) => r.id !== guildId && !r.managed)
      .map((r: any) => ({ id: r.id, name: r.name }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error("Error fetching roles:", err)
    return []
  }
}

