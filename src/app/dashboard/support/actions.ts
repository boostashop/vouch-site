"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { rateLimit, getClientIp, retryAfterText } from "@/lib/rate-limit"
import { sendEmail, ticketStaffNotifyEmail } from "@/lib/email"
import { TICKET_LIMITS, CATEGORY_VALUES } from "@/lib/tickets"

type ActionState = { error?: string; ok?: boolean } | undefined

function displayName(u: { name?: string | null; username?: string | null; email?: string | null }) {
  return u.name || u.username || u.email || "User"
}

// Email every active admin that a ticket needs attention. Best-effort: a send
// failure is swallowed (logged in sendEmail) and never blocks the DB write.
async function notifyStaff(opts: {
  kind: "new" | "reply"
  fromName: string
  ticketId: string
  ticketSubject: string
  category: string
  body: string
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", bannedAt: null, email: { not: null } },
    select: { email: true },
  })
  const to = admins.map((a) => a.email!).filter(Boolean)
  if (to.length === 0) return
  const { subject, html, text } = ticketStaffNotifyEmail(opts)
  await sendEmail({ to, subject, html, text })
}

export async function createTicket(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: "You must be signed in." }

  const subject = (formData.get("subject") as string | null)?.trim() ?? ""
  const category = (formData.get("category") as string | null) ?? ""
  const body = (formData.get("message") as string | null)?.trim() ?? ""

  if (!subject) return { error: "Please add a subject." }
  if (subject.length > TICKET_LIMITS.subject) return { error: "Subject is too long." }
  if (!CATEGORY_VALUES.includes(category)) return { error: "Please pick a category." }
  if (!body) return { error: "Please describe your issue or suggestion." }
  if (body.length > TICKET_LIMITS.body) return { error: "Message is too long." }

  // Throttle ticket creation per user (and IP) to blunt spam.
  const ip = await getClientIp().catch(() => "unknown")
  const byUser = rateLimit(`ticket:create:user:${userId}`, 5, 10 * 60 * 1000)
  const byIp = rateLimit(`ticket:create:ip:${ip}`, 10, 10 * 60 * 1000)
  if (!byUser.ok || !byIp.ok) {
    const wait = retryAfterText(Math.max(byUser.retryAfterMs, byIp.retryAfterMs))
    return { error: `You've opened a lot of tickets — please wait ${wait} and try again.` }
  }

  const fromName = displayName(session!.user!)
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      category: category as never,
      messages: {
        create: { authorId: userId, authorName: fromName, authorRole: "USER", body },
      },
    },
    select: { id: true },
  })

  await notifyStaff({
    kind: "new",
    fromName,
    ticketId: ticket.id,
    ticketSubject: subject,
    category,
    body,
  })

  revalidatePath("/dashboard/support")
  redirect(`/dashboard/support/${ticket.id}`)
}

export async function replyToTicket(ticketId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: "You must be signed in." }

  const body = (formData.get("message") as string | null)?.trim() ?? ""
  if (!body) return { error: "Please write a reply." }
  if (body.length > TICKET_LIMITS.body) return { error: "Message is too long." }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, status: true, subject: true, category: true },
  })
  if (!ticket || ticket.userId !== userId) return { error: "Ticket not found." }
  if (ticket.status === "CLOSED") return { error: "This ticket is closed. Open a new one if you still need help." }

  const byUser = rateLimit(`ticket:reply:user:${userId}`, 20, 10 * 60 * 1000)
  if (!byUser.ok) {
    return { error: `You're sending replies very quickly — please wait ${retryAfterText(byUser.retryAfterMs)}.` }
  }

  const fromName = displayName(session!.user!)
  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId, authorId: userId, authorName: fromName, authorRole: "USER", body },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        awaitingStaff: true,
        lastMessageAt: new Date(),
        // A reply on a resolved ticket reopens it.
        status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status,
      },
    }),
  ])

  await notifyStaff({
    kind: "reply",
    fromName,
    ticketId,
    ticketSubject: ticket.subject,
    category: ticket.category,
    body,
  })

  revalidatePath(`/dashboard/support/${ticketId}`)
  revalidatePath("/dashboard/support")
  return { ok: true }
}

export async function closeTicketByUser(ticketId: string): Promise<void> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { userId: true },
  })
  if (!ticket || ticket.userId !== userId) return

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "CLOSED", awaitingStaff: false },
  })

  revalidatePath(`/dashboard/support/${ticketId}`)
  revalidatePath("/dashboard/support")
}
