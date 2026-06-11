"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
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
