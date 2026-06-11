"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin"

// Delete expired auth rows. With JWT sessions the Session table is usually
// empty, but the Resend (magic-link) provider accumulates VerificationToken
// rows that are never cleaned up — this clears both, by expiry.
export async function pruneStaleData() {
  await requireAdmin()

  const now = new Date()
  const [sessions, tokens] = await Promise.all([
    prisma.session.deleteMany({ where: { expires: { lt: now } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
  ])

  redirect(`/admin/settings?pruned=${sessions.count + tokens.count}`)
}
