import { randomUUID } from "node:crypto"
import { uploadToR2 } from "../lib/s3"
import { prisma } from "./prisma"
import { checkIllegalContent } from "../lib/content-moderation"

// Platform-agnostic helpers shared by the Discord and Telegram bots. As the
// overhaul progresses (anti-abuse, validation, vouch creation) the shared logic
// consolidates here so both platforms stay in lockstep.

import { hasActivePremium } from "../lib/premium"
export { hasActivePremium }

export const FREE_VOUCH_LIMIT = 50

// Discord's EmbedBuilder.setColor throws on anything that isn't a valid color,
// which would crash a reply mid-flow — only let plain hex through.
export function safeEmbedColor(value: string | null | undefined, fallback = "#5865F2"): `#${string}` {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) return value as `#${string}`
  return fallback as `#${string}`
}

// Discord embed field values cap at 1024 chars; longer input throws.
export function embedField(text: string, max = 1024): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text
}

// Persist a remote proof image to R2 and return its public URL, or null if R2
// isn't configured or the upload fails. We deliberately never fall back to the
// source URL: Discord CDN links are short-lived, and Telegram file links embed
// the bot token (`/file/bot<TOKEN>/…`) — storing either would break the image or
// leak the token on the public profile.
export async function persistProofToR2(
  sourceUrl: string,
  key: string,
  contentType: string,
): Promise<string | null> {
  if (!process.env.R2_ENDPOINT) return null
  try {
    const response = await fetch(sourceUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return await uploadToR2(buffer, key, contentType)
  } catch (err) {
    console.error("Failed to persist proof to R2:", err)
    return null
  }
}

export function proofKey(platform: "discord" | "telegram", ext: string): string {
  const prefix = platform === "telegram" ? "tg-" : ""
  return `proofs/${prefix}${randomUUID()}.${ext}`
}

// Global leaderboard position by vouch count (1 = most vouches). Returns 0 for
// users with no vouches. Used by the /stats "Leaderboard" line on both bots.
export async function getLeaderboardRank(vouchCount: number): Promise<number> {
  if (vouchCount <= 0) return 0
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM (
      SELECT "receiverId" FROM "Vouch" WHERE "status" = 'ACTIVE' GROUP BY "receiverId" HAVING COUNT(*) > ${vouchCount}
    ) t`
  return Number(rows[0]?.count ?? 0) + 1
}

// -----------------------------------------------------------------------------
// Phase 1: Shared Vouch Validation, Anti-Abuse, Blacklisting & Moderation
// -----------------------------------------------------------------------------

export async function validateVouchRules({
  receiverId,
  giverId,
  platform,
  comment,
  guildId,
  giverCreatedAt,
}: {
  receiverId: string
  giverId: string
  platform: "discord" | "telegram"
  comment: string
  guildId?: string | null
  giverCreatedAt?: Date
}) {
  // 1. Min comment length check
  if (!comment || comment.trim().length < 4) {
    throw new Error("Vouch feedback must be at least 4 characters long.")
  }

  // Fetch the receiver config/user
  const config = await getActiveConfig(receiverId, guildId || null)
  if (!config) {
    throw new Error("Seller profile not found.")
  }

  // 2. Self-vouch block
  const receiverPlatformId = platform === "discord" ? config.discordId : config.telegramId
  if (receiverPlatformId && giverId === receiverPlatformId) {
    throw new Error("You cannot vouch for yourself.")
  }

  // 3. Blacklist check
  const isBlacklisted = await prisma.blacklist.findUnique({
    where: {
      userId_platform_blockedId: {
        userId: receiverId,
        platform,
        blockedId: giverId,
      },
    },
  })
  if (isBlacklisted) {
    throw new Error("You have been blacklisted by this seller and cannot leave a vouch.")
  }

  // 4. Discord account age check
  if (platform === "discord" && config.minAccountAgeDays > 0 && giverCreatedAt) {
    const ageInDays = (Date.now() - giverCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (ageInDays < config.minAccountAgeDays) {
      throw new Error(`Your Discord account must be at least ${config.minAccountAgeDays} days old to vouch for this seller.`)
    }
  }

  // 5. Rate limit / cooldown: Max 3 vouches per giver per receiver per 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentCount = await prisma.vouch.count({
    where: {
      receiverId,
      giverId,
      platform,
      createdAt: { gte: oneDayAgo },
      status: { not: "REMOVED" },
    },
  })
  if (recentCount >= 3) {
    throw new Error("Rate limit exceeded. You can only leave up to 3 vouches per seller every 24 hours.")
  }
}

export async function addToBlacklist({
  userId,
  platform,
  blockedId,
  reason,
}: {
  userId: string
  platform: "discord" | "telegram"
  blockedId: string
  reason: string | null
}) {
  return await prisma.blacklist.upsert({
    where: {
      userId_platform_blockedId: {
        userId,
        platform,
        blockedId,
      },
    },
    create: {
      userId,
      platform,
      blockedId,
      reason,
    },
    update: {
      reason,
    },
  })
}

export async function removeFromBlacklist({
  userId,
  platform,
  blockedId,
}: {
  userId: string
  platform: "discord" | "telegram"
  blockedId: string
}) {
  try {
    await prisma.blacklist.delete({
      where: {
        userId_platform_blockedId: {
          userId,
          platform,
          blockedId,
        },
      },
    })
    return true
  } catch (err) {
    return false
  }
}

export async function reportVouch({
  vouchId,
  reporterId,
  reason,
}: {
  vouchId: string
  reporterId: string
  reason: string | null
}) {
  const vouch = await prisma.vouch.findUnique({
    where: { id: vouchId },
  })
  if (!vouch) {
    throw new Error("Vouch not found.")
  }

  // Create report
  await prisma.vouchReport.create({
    data: {
      vouchId,
      reporterId,
      reason,
    },
  })

  // Set vouch status to FLAGGED
  await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "FLAGGED" },
  })

  return vouch
}

export async function getPendingReports(userId: string) {
  // Find all vouches for this receiver that are FLAGGED
  return await prisma.vouch.findMany({
    where: {
      receiverId: userId,
      status: "FLAGGED",
    },
    orderBy: {
      createdAt: "asc",
    },
  })
}

export async function approveVouch(userId: string, vouchId: string) {
  const vouch = await prisma.vouch.findUnique({
    where: { id: vouchId },
  })
  if (!vouch || vouch.receiverId !== userId) {
    throw new Error("Vouch not found or unauthorized.")
  }

  // Delete all reports for this vouch
  await prisma.vouchReport.deleteMany({
    where: { vouchId },
  })

  // Set status back to ACTIVE
  return await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "ACTIVE" },
  })
}

export async function removeVouch(userId: string, vouchId: string) {
  const vouch = await prisma.vouch.findUnique({
    where: { id: vouchId },
  })
  if (!vouch || vouch.receiverId !== userId) {
    throw new Error("Vouch not found or unauthorized.")
  }

  // Delete all reports for this vouch
  await prisma.vouchReport.deleteMany({
    where: { vouchId },
  })

  // Soft delete: set status to REMOVED
  return await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "REMOVED" },
  })
}

// Run automated content screening on a newly created vouch. Call fire-and-forget
// (`.catch(console.error)`) — a failure must never block the user flow.
export async function autoModerateVouch(vouchId: string, comment: string | null): Promise<void> {
  if (!comment) return
  const flag = checkIllegalContent(comment)
  if (!flag) return
  const reason = `${flag.label} (matched: "${flag.match}")`
  await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "FLAGGED", autoFlagReason: reason },
  })
}

export function isMilestone(vouchCount: number): boolean {
  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000]
  return milestones.includes(vouchCount) || (vouchCount > 100 && vouchCount % 100 === 0)
}

export async function getActiveConfig(userId: string, guildId: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) return null

  const isPremium = hasActivePremium(user)

  if (guildId) {
    const guildConfig = await prisma.guildConfig.findUnique({
      where: { userId_guildId: { userId, guildId } },
    })
    if (guildConfig) {
      return {
        requireProof: guildConfig.requireProof,
        vouchChannelId: guildConfig.vouchChannelId,
        minAccountAgeDays: guildConfig.minAccountAgeDays,
        pinnedMessageId: guildConfig.pinnedMessageId,
        vouchEmbedTitle: user.vouchEmbedTitle,
        vouchEmbedFooter: user.vouchEmbedFooter,
        vouchEmbedColor: user.vouchEmbedColor,
        vouchEmbedDescription: user.vouchEmbedDescription,
        vouchEmbedAuthorName: user.vouchEmbedAuthorName,
        vouchEmbedAuthorIconUrl: user.vouchEmbedAuthorIconUrl,
        vouchEmbedThumbnailUrl: user.vouchEmbedThumbnailUrl,
        vouchEmbedFooterIconUrl: user.vouchEmbedFooterIconUrl,
        vouchEmbedTimestamp: user.vouchEmbedTimestamp,
        vouchShowCount: user.vouchShowCount,
        vouchTagUser: user.vouchTagUser,
        vouchEmoji: user.vouchEmoji,
        vouchRoleId: user.vouchRoleId,
        isPremium,
        discordId: user.discordId,
        telegramId: user.telegramId,
        slug: user.slug,
        name: user.name,
        username: user.username,
      }
    }
  }

  return {
    requireProof: user.vouchRequireProof,
    vouchChannelId: user.vouchChannelId,
    minAccountAgeDays: 0,
    pinnedMessageId: null,
    vouchEmbedTitle: user.vouchEmbedTitle,
    vouchEmbedFooter: user.vouchEmbedFooter,
    vouchEmbedColor: user.vouchEmbedColor,
    vouchEmbedDescription: user.vouchEmbedDescription,
    vouchEmbedAuthorName: user.vouchEmbedAuthorName,
    vouchEmbedAuthorIconUrl: user.vouchEmbedAuthorIconUrl,
    vouchEmbedThumbnailUrl: user.vouchEmbedThumbnailUrl,
    vouchEmbedFooterIconUrl: user.vouchEmbedFooterIconUrl,
    vouchEmbedTimestamp: user.vouchEmbedTimestamp,
    vouchShowCount: user.vouchShowCount,
    vouchTagUser: user.vouchTagUser,
    vouchEmoji: user.vouchEmoji,
    vouchRoleId: user.vouchRoleId,
    isPremium,
    discordId: user.discordId,
    telegramId: user.telegramId,
    slug: user.slug,
    name: user.name,
    username: user.username,
  }
}



