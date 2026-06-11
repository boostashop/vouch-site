"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { requireAdmin as ensureAdmin } from "@/lib/admin"

export async function toggleUserPremium(userId: string, isPremium: boolean) {
  await ensureAdmin()

  // Always clear the expiry: a stale past date would make an admin grant
  // useless (hasActivePremium checks the date), and a revoke should not leave
  // a dangling expiry behind. Admin-granted premium has no expiry by design.
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium, premiumExpiresAt: null }
  })

  revalidatePath("/admin/users")
}

export async function toggleUserRole(userId: string, role: "USER" | "ADMIN") {
  await ensureAdmin()
  
  await prisma.user.update({
    where: { id: userId },
    data: { role }
  })
  
  revalidatePath("/admin/users")
}

export async function deleteVouch(vouchId: string) {
  await ensureAdmin()

  await prisma.vouch.delete({
    where: { id: vouchId }
  })

  revalidatePath("/admin/vouches")
}

// Grant premium for a fixed number of days (0 = no expiry / forever). Sets a
// concrete future expiry so it lapses on its own — and clears any stale past
// date so the grant actually takes effect.
export async function grantPremium(userId: string, days: number) {
  await ensureAdmin()

  const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true, premiumExpiresAt: expiresAt },
  })

  revalidatePath("/admin/users")
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

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/admin/users")
}
