"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin"
import { setSetting, SIGNUPS_PAUSED_KEY } from "@/lib/settings"
import { logAdminAction } from "@/lib/audit"

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

// Pause / resume new account creation (credentials sign-up + magic-link signup
// for new emails). Existing users can always still sign in. Used as a kill-switch
// during beta if something goes wrong.
export async function setSignupsPaused(paused: boolean) {
  await requireAdmin()

  await setSetting(SIGNUPS_PAUSED_KEY, paused ? "true" : "false")

  await logAdminAction({
    action: "SIGNUPS_TOGGLE",
    targetType: "setting",
    targetId: SIGNUPS_PAUSED_KEY,
    summary: paused ? "Paused new signups" : "Re-opened new signups",
  })

  revalidatePath("/admin/settings")
}
