"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { removeVouch, approveVouch } from "@/bots/vouch-service"

// Web moderation actions. Each re-checks ownership (receiverId === current user)
// via the shared vouch-service helpers or an explicit guard, so a user can only
// touch their own vouches.

export async function removeVouchAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const vouchId = formData.get("vouchId") as string
  if (!vouchId) return
  await removeVouch(session.user.id, vouchId) // soft-delete (status REMOVED)
  revalidatePath("/dashboard/vouches")
}

// Restore a REMOVED or approve a FLAGGED vouch back to ACTIVE (clears reports).
export async function restoreVouchAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const vouchId = formData.get("vouchId") as string
  if (!vouchId) return
  await approveVouch(session.user.id, vouchId)
  revalidatePath("/dashboard/vouches")
}

export async function replyVouchAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const vouchId = formData.get("vouchId") as string
  const reply = ((formData.get("reply") as string) || "").trim()
  if (!vouchId) return

  const vouch = await prisma.vouch.findUnique({ where: { id: vouchId }, select: { receiverId: true } })
  if (!vouch || vouch.receiverId !== session.user.id) throw new Error("Not found or unauthorized")

  await prisma.vouch.update({
    where: { id: vouchId },
    // Empty reply clears it.
    data: { sellerReply: reply ? reply.slice(0, 1000) : null },
  })
  revalidatePath("/dashboard/vouches")
}
