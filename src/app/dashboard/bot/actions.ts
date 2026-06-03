import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateBotTokens(formData: FormData) {
  "use server"

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
    if (v) data.discordBotToken = v
  }
  if (formData.has("telegramToken")) {
    const v = (formData.get("telegramToken") as string).trim()
    if (v) data.telegramBotToken = v
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: session.user.id }, data })
  }

  revalidatePath("/dashboard/bot")
}

export async function removeBotToken(formData: FormData) {
  "use server"

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
  "use server"
  
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
  "use server"
  
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
