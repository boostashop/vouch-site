import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// Append-only admin action log. Resolves the acting admin from the session and
// records a human-readable summary. Best-effort: a logging failure must never
// block the underlying admin action, so errors are swallowed (and surfaced to
// the server console) rather than thrown.

export type AuditAction =
  | "USER_BAN"
  | "USER_UNBAN"
  | "USER_DELETE"
  | "PREMIUM_GRANT"
  | "PREMIUM_REVOKE"
  | "ROLE_CHANGE"
  | "VOUCH_DELETE"
  | "VOUCH_APPROVE"
  | "VOUCH_REMOVE"
  | "SIGNUPS_TOGGLE"
  | "TICKET_REPLY"
  | "TICKET_STATUS"
  | "TICKET_PRIORITY"

export async function logAdminAction(entry: {
  action: AuditAction
  targetType: "user" | "vouch" | "setting" | "ticket"
  targetId?: string | null
  summary: string
}): Promise<void> {
  try {
    const session = await auth()
    await prisma.adminAuditLog.create({
      data: {
        actorId: session?.user?.id ?? null,
        actorEmail: session?.user?.email ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        summary: entry.summary,
      },
    })
  } catch (err) {
    console.error("[audit] failed to record admin action", entry.action, err)
  }
}
