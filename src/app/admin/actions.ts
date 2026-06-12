"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { requireAdmin as ensureAdmin } from "@/lib/admin"
import { logAdminAction } from "@/lib/audit"

// Short label for a user, for human-readable audit summaries.
function userLabel(u: { name?: string | null; username?: string | null; email?: string | null }) {
  return u.name || u.username || u.email || "user"
}

export async function toggleUserPremium(userId: string, isPremium: boolean) {
  await ensureAdmin()

  // Always clear the expiry: a stale past date would make an admin grant
  // useless (hasActivePremium checks the date), and a revoke should not leave
  // a dangling expiry behind. Admin-granted premium has no expiry by design.
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isPremium, premiumExpiresAt: null },
    select: { name: true, username: true, email: true },
  })

  await logAdminAction({
    action: isPremium ? "PREMIUM_GRANT" : "PREMIUM_REVOKE",
    targetType: "user",
    targetId: userId,
    summary: `${isPremium ? "Granted" : "Revoked"} premium for ${userLabel(user)}`,
  })

  revalidatePath("/admin/users")
}

export async function toggleUserRole(userId: string, role: "USER" | "ADMIN") {
  await ensureAdmin()

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { name: true, username: true, email: true },
  })

  await logAdminAction({
    action: "ROLE_CHANGE",
    targetType: "user",
    targetId: userId,
    summary: `Set ${userLabel(user)} role to ${role}`,
  })

  revalidatePath("/admin/users")
}

export async function deleteVouch(vouchId: string) {
  await ensureAdmin()

  const vouch = await prisma.vouch.delete({
    where: { id: vouchId },
    select: { giverName: true },
  })

  await logAdminAction({
    action: "VOUCH_DELETE",
    targetType: "vouch",
    targetId: vouchId,
    summary: `Deleted vouch from ${vouch.giverName}`,
  })

  revalidatePath("/admin/vouches")
}

// Grant premium for a fixed number of days (0 = no expiry / forever). Sets a
// concrete future expiry so it lapses on its own — and clears any stale past
// date so the grant actually takes effect.
export async function grantPremium(userId: string, days: number) {
  await ensureAdmin()

  const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true, premiumExpiresAt: expiresAt },
    select: { name: true, username: true, email: true },
  })

  await logAdminAction({
    action: "PREMIUM_GRANT",
    targetType: "user",
    targetId: userId,
    summary: `Granted premium for ${userLabel(user)} (${days > 0 ? `${days} days` : "no expiry"})`,
  })

  revalidatePath("/admin/users")
}

// Ban a user: reversible moderation. Blocks sign-in (credentials + magic link)
// and hides their public profile/vouches, but retains all data. See the
// enforcement points in src/auth.ts and src/app/dashboard/layout.tsx.
export async function banUser(userId: string, reason: string) {
  await ensureAdmin()

  const session = await auth()
  if (session?.user?.id === userId) {
    throw new Error("You cannot ban your own admin account.")
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: new Date(), banReason: reason.trim() || null },
    select: { name: true, username: true, email: true },
  })

  await logAdminAction({
    action: "USER_BAN",
    targetType: "user",
    targetId: userId,
    summary: `Banned ${userLabel(user)}${reason.trim() ? ` — ${reason.trim()}` : ""}`,
  })

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
}

export async function unbanUser(userId: string) {
  await ensureAdmin()

  const user = await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: null, banReason: null },
    select: { name: true, username: true, email: true },
  })

  await logAdminAction({
    action: "USER_UNBAN",
    targetType: "user",
    targetId: userId,
    summary: `Unbanned ${userLabel(user)}`,
  })

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
}

// Permanently delete a user and everything referencing them (vouches, reports,
// blacklist, guild configs, sessions/accounts) via the ON DELETE CASCADE
// constraints. Admins cannot delete their own account here (use the dashboard
// Danger Zone) to avoid locking themselves out by accident.
export async function deleteUser(userId: string) {
  await ensureAdmin()

  const session = await auth()
  if (session?.user?.id === userId) {
    throw new Error("You cannot delete your own admin account from here.")
  }

  // Capture identity before deletion so the audit trail is meaningful.
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true, email: true },
  })

  await prisma.user.delete({ where: { id: userId } })

  await logAdminAction({
    action: "USER_DELETE",
    targetType: "user",
    targetId: userId,
    summary: `Deleted account ${target ? userLabel(target) : userId}`,
  })

  revalidatePath("/admin/users")
}
