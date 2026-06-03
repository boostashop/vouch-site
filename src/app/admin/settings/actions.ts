"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

// Delete expired auth rows. With JWT sessions the Session table is usually
// empty, but the Resend (magic-link) provider accumulates VerificationToken
// rows that are never cleaned up — this clears both, by expiry.
export async function pruneStaleData() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const now = new Date()
  const [sessions, tokens] = await Promise.all([
    prisma.session.deleteMany({ where: { expires: { lt: now } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
  ])

  redirect(`/admin/settings?pruned=${sessions.count + tokens.count}`)
}
