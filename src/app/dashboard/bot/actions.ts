"use server"

import crypto from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { encryptSecret, decryptSecret } from "@/lib/crypto"

// One-time code the user types into their Telegram bot (/link <code>) to prove
// they own this dashboard account. Stored in VerificationToken so no schema
// change is needed; 15-minute expiry, regenerating invalidates older codes.
export async function generateTelegramLinkCode() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const identifier = `telegram-link:${session.user.id}`
  const code = crypto.randomBytes(4).toString("hex")

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({
    data: { identifier, token: code, expires: new Date(Date.now() + 15 * 60 * 1000) },
  })

  redirect("/dashboard/bot?tab=telegram")
}

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
  let tab = "discord"

  if (formData.has("discordToken")) {
    const v = (formData.get("discordToken") as string).trim()
    if (v) data.discordBotToken = encryptSecret(v)
  }
  if (formData.has("telegramToken")) {
    const v = (formData.get("telegramToken") as string).trim()
    if (v) data.telegramBotToken = encryptSecret(v)
    tab = "telegram"
  }

  const saved = Object.keys(data).length > 0
  if (saved) {
    await prisma.user.update({ where: { id: session.user.id }, data })
  }

  redirect(`/dashboard/bot?tab=${tab}${saved ? "&saved=1" : ""}`)
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

  const tab = platform === "telegram" ? "telegram" : "discord"
  redirect(`/dashboard/bot?tab=${tab}&saved=1`)
}

export async function updateVouchSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const { hasActivePremium } = await import("@/lib/premium")
  const isPremium = user ? hasActivePremium(user) : false

  const vouchEmbedColor = formData.get("vouchEmbedColor") as string
  const vouchEmbedTimestamp = formData.get("vouchEmbedTimestamp") === "on"
  const vouchRequireProof = formData.get("vouchRequireProof") === "on"
  const vouchShowCount = formData.get("vouchShowCount") === "on"
  const vouchTagUser = formData.get("vouchTagUser") === "on"
  const vouchChannelId = formData.get("vouchChannelId") as string
  const vouchRoleId = formData.get("vouchRoleId") as string
  const vouchEmoji = formData.get("vouchEmoji") as string

  const data: Parameters<typeof prisma.user.update>[0]["data"] = {
    vouchEmbedColor: vouchEmbedColor || undefined,
    vouchEmbedTimestamp,
    vouchRequireProof,
    vouchShowCount,
    vouchTagUser,
    vouchChannelId: isPremium ? (vouchChannelId || null) : undefined,
    vouchRoleId: isPremium ? (vouchRoleId || null) : undefined,
    vouchEmoji: isPremium ? (vouchEmoji || null) : undefined,
  }

  if (isPremium) {
    const vouchEmbedTitle = formData.get("vouchEmbedTitle") as string
    const vouchEmbedFooter = formData.get("vouchEmbedFooter") as string
    const vouchEmbedDescription = formData.get("vouchEmbedDescription") as string
    const vouchEmbedAuthorName = formData.get("vouchEmbedAuthorName") as string
    const vouchEmbedAuthorIconUrl = formData.get("vouchEmbedAuthorIconUrl") as string
    const vouchEmbedThumbnailUrl = formData.get("vouchEmbedThumbnailUrl") as string
    const vouchEmbedFooterIconUrl = formData.get("vouchEmbedFooterIconUrl") as string
    Object.assign(data, {
      vouchEmbedTitle: vouchEmbedTitle || undefined,
      vouchEmbedFooter: vouchEmbedFooter || undefined,
      vouchEmbedDescription: vouchEmbedDescription || null,
      vouchEmbedAuthorName: vouchEmbedAuthorName || null,
      vouchEmbedAuthorIconUrl: vouchEmbedAuthorIconUrl || null,
      vouchEmbedThumbnailUrl: vouchEmbedThumbnailUrl || null,
      vouchEmbedFooterIconUrl: vouchEmbedFooterIconUrl || null,
    })
  }

  await prisma.user.update({ where: { id: session.user.id }, data })

  redirect("/dashboard/bot?tab=discord&saved=1")
}

export async function updateStatsSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const { hasActivePremium } = await import("@/lib/premium")
  if (!user || !hasActivePremium(user)) throw new Error("Premium required")

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

  const statsEmbedAuthorName = formData.get("statsEmbedAuthorName") as string
  const statsEmbedAuthorIconUrl = formData.get("statsEmbedAuthorIconUrl") as string
  const statsEmbedThumbnailUrl = formData.get("statsEmbedThumbnailUrl") as string
  const statsEmbedFooterIconUrl = formData.get("statsEmbedFooterIconUrl") as string

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      statsEmbedTitle: statsEmbedTitle || undefined,
      statsEmbedDescription: statsEmbedDescription || undefined,
      statsEmbedFooter: statsEmbedFooter || undefined,
      statsEmbedColor: statsEmbedColor || undefined,
      statsEmbedAuthorName: statsEmbedAuthorName || null,
      statsEmbedAuthorIconUrl: statsEmbedAuthorIconUrl || null,
      statsEmbedThumbnailUrl: statsEmbedThumbnailUrl || null,
      statsEmbedFooterIconUrl: statsEmbedFooterIconUrl || null,
      statsShowCount,
      statsShowScore,
      statsShowLeaderboard,
      statsShowPlan,
      statsShowExpiration,
      statsShowAge,
    }
  })

  redirect("/dashboard/bot?tab=discord&saved=1")
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
    return roles
      .filter((r: any) => r.id !== guildId && !r.managed)
      .map((r: any) => ({ id: r.id, name: r.name }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error("Error fetching roles:", err)
    return []
  }
}
