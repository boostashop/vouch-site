import { v4 as uuidv4 } from "uuid"
import { uploadToR2 } from "../lib/s3"
import { prisma } from "./prisma"

// Platform-agnostic helpers shared by the Discord and Telegram bots. As the
// overhaul progresses (anti-abuse, validation, vouch creation) the shared logic
// consolidates here so both platforms stay in lockstep.

export { hasActivePremium } from "../lib/premium"

export const FREE_VOUCH_LIMIT = 50

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
  return `proofs/${prefix}${uuidv4()}.${ext}`
}

// Global leaderboard position by vouch count (1 = most vouches). Returns 0 for
// users with no vouches. Used by the /stats "Leaderboard" line on both bots.
export async function getLeaderboardRank(vouchCount: number): Promise<number> {
  if (vouchCount <= 0) return 0
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM (
      SELECT "receiverId" FROM "Vouch" GROUP BY "receiverId" HAVING COUNT(*) > ${vouchCount}
    ) t`
  return Number(rows[0]?.count ?? 0) + 1
}
