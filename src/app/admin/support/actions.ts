"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { requireAdmin as ensureAdmin } from "@/lib/admin"
import { logAdminAction } from "@/lib/audit"
import { sendEmail, ticketUserReplyEmail } from "@/lib/email"
import { TICKET_LIMITS, STATUS_VALUES, PRIORITY_VALUES, STATUS_LABEL, PRIORITY_LABEL } from "@/lib/tickets"

type ActionState = { error?: string; ok?: boolean } | undefined

function adminName(u: { name?: string | null; username?: string | null; email?: string | null }) {
  return u.name || u.username || u.email || "Staff"
}

export async function replyToTicketAsAdmin(
  ticketId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await ensureAdmin()
  const session = await auth()

  const body = (formData.get("message") as string | null)?.trim() ?? ""
  const internal = formData.get("internal") === "1"
  if (!body) return { error: "Please write a reply." }
  if (body.length > TICKET_LIMITS.body) return { error: "Message is too long." }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      subject: true,
      status: true,
      user: { select: { email: true, name: true, username: true } },
    },
  })
  if (!ticket) return { error: "Ticket not found." }

  const author = adminName(session!.user!)
  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: session?.user?.id ?? null,
        authorName: author,
        authorRole: "ADMIN",
        body,
        internal,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: internal
        ? {} // internal notes don't change workflow state or clear "awaiting staff"
        : {
            awaitingStaff: false,
            lastMessageAt: new Date(),
            status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
          },
    }),
  ])

  await logAdminAction({
    action: "TICKET_REPLY",
    targetType: "ticket",
    targetId: ticketId,
    summary: `${internal ? "Added internal note to" : "Replied to"} ticket "${ticket.subject}"`,
  })

  // Notify the ticket owner — but never for internal notes.
  if (!internal && ticket.user.email) {
    const { subject, html, text } = ticketUserReplyEmail({
      recipient: ticket.user.email,
      ticketSubject: ticket.subject,
      body,
      ticketId,
    })
    await sendEmail({ to: ticket.user.email, subject, html, text })
  }

  revalidatePath(`/admin/support/${ticketId}`)
  revalidatePath("/admin/support")
  return { ok: true }
}

export async function setTicketStatus(ticketId: string, status: string): Promise<void> {
  await ensureAdmin()
  if (!STATUS_VALUES.includes(status as never)) return

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: status as never,
      // Resolving/closing means it no longer needs a staff reply.
      awaitingStaff: status === "RESOLVED" || status === "CLOSED" ? false : undefined,
    },
    select: { subject: true },
  })

  await logAdminAction({
    action: "TICKET_STATUS",
    targetType: "ticket",
    targetId: ticketId,
    summary: `Set ticket "${ticket.subject}" to ${STATUS_LABEL[status]}`,
  })

  revalidatePath(`/admin/support/${ticketId}`)
  revalidatePath("/admin/support")
}

export async function setTicketPriority(ticketId: string, priority: string): Promise<void> {
  await ensureAdmin()
  if (!PRIORITY_VALUES.includes(priority as never)) return

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { priority: priority as never },
    select: { subject: true },
  })

  await logAdminAction({
    action: "TICKET_PRIORITY",
    targetType: "ticket",
    targetId: ticketId,
    summary: `Set ticket "${ticket.subject}" priority to ${PRIORITY_LABEL[priority]}`,
  })

  revalidatePath(`/admin/support/${ticketId}`)
  revalidatePath("/admin/support")
}
