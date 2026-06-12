import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Mail, ExternalLink } from "lucide-react"
import { Thread } from "@/components/support/thread"
import { ReplyForm } from "@/components/support/reply-form"
import { TicketAdminControls } from "@/components/support/admin-controls"
import { replyToTicketAsAdmin } from "../actions"
import { STATUS_LABEL, STATUS_CHIP, CATEGORY_LABEL, PRIORITY_LABEL, PRIORITY_CHIP } from "@/lib/tickets"

export const dynamic = "force-dynamic"

export default async function AdminTicketPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, username: true, email: true } },
    },
  })
  if (!ticket) notFound()

  const userName = ticket.user.name || ticket.user.username || ticket.user.email || "Unknown user"

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500">
      <div>
        <Link
          href="/admin/support"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to queue
        </Link>
        <h1 className="page-title">{ticket.subject}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={STATUS_CHIP[ticket.status]}>{STATUS_LABEL[ticket.status]}</span>
          <span className={PRIORITY_CHIP[ticket.priority]}>{PRIORITY_LABEL[ticket.priority]} priority</span>
          <span className="chip-zinc">{CATEGORY_LABEL[ticket.category]}</span>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock size={11} />
            Opened {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Requester + workflow controls */}
      <div className="card card-body space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">From</span>
            <Link
              href={`/admin/users/${ticket.user.id}`}
              className="inline-flex items-center gap-1 font-medium text-zinc-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
            >
              {userName}
              <ExternalLink size={12} className="text-zinc-400" />
            </Link>
          </div>
          {ticket.user.email && (
            <a
              href={`mailto:${ticket.user.email}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <Mail size={13} />
              {ticket.user.email}
            </a>
          )}
        </div>
        <div className="border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
          <TicketAdminControls ticketId={ticket.id} status={ticket.status} priority={ticket.priority} />
        </div>
      </div>

      <div className="card card-body">
        <Thread messages={ticket.messages} viewerRole="ADMIN" />
      </div>

      <div className="card card-body">
        <ReplyForm action={replyToTicketAsAdmin.bind(null, ticket.id)} allowInternal placeholder="Reply to the user, or add an internal note…" />
      </div>
    </div>
  )
}
