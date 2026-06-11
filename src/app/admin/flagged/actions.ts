"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAdmin as ensureAdmin } from "@/lib/admin"

export async function approveFlaggedVouch(vouchId: string) {
  await ensureAdmin()

  await prisma.vouchReport.deleteMany({ where: { vouchId } })
  await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "ACTIVE", autoFlagReason: null },
  })

  revalidatePath("/admin/flagged")
}

export async function removeFlaggedVouch(vouchId: string) {
  await ensureAdmin()

  await prisma.vouchReport.deleteMany({ where: { vouchId } })
  await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "REMOVED" },
  })

  revalidatePath("/admin/flagged")
}
