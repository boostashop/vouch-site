"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAdmin as ensureAdmin } from "@/lib/admin"
import { logAdminAction } from "@/lib/audit"

export async function approveFlaggedVouch(vouchId: string) {
  await ensureAdmin()

  await prisma.vouchReport.deleteMany({ where: { vouchId } })
  const vouch = await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "ACTIVE", autoFlagReason: null },
    select: { giverName: true },
  })

  await logAdminAction({
    action: "VOUCH_APPROVE",
    targetType: "vouch",
    targetId: vouchId,
    summary: `Approved flagged vouch from ${vouch.giverName}`,
  })

  revalidatePath("/admin/flagged")
}

export async function removeFlaggedVouch(vouchId: string) {
  await ensureAdmin()

  await prisma.vouchReport.deleteMany({ where: { vouchId } })
  const vouch = await prisma.vouch.update({
    where: { id: vouchId },
    data: { status: "REMOVED" },
    select: { giverName: true },
  })

  await logAdminAction({
    action: "VOUCH_REMOVE",
    targetType: "vouch",
    targetId: vouchId,
    summary: `Removed flagged vouch from ${vouch.giverName}`,
  })

  revalidatePath("/admin/flagged")
}
