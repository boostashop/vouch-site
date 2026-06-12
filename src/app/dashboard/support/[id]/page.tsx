import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle, Lock } from "lucide-react"
import { Thread } from "@/components/support/thread"
import { ReplyForm } from "@/components/support/reply-form"
import { replyToTicket, closeTicketByUser } from "../actions"
import { STATUS_LABEL, STATUS_CHIP, CATEGORY_LABEL } from "@/lib/tickets"

export const dynamic = "force-dynamic"

export default async function SupportTicketPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  })

  // Not found / not yours look identical so a ticket id can't be probed.
  if (!ticket || ticket.userId !== session.user.id) notFound()

  // Users never see internal staff notes.
  const visible = ticket.messages.filter((m) => !m.internal)
  const closed = ticket.status === "CLOSED"

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500">
      <div>
        <Link
          href="/dashboard/support"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to support
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">{ticket.subject}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={STATUS_CHIP[ticket.status]}>{STATUS_LABEL[ticket.status]}</span>
              <span className="chip-zinc">{CATEGORY_LABEL[ticket.category]}</span>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock size={11} />
                Opened {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {!closed && (
            <form
              action={async () => {
                "use server"
                await closeTicketByUser(ticket.id)
              }}
            >
              <button className="btn-secondary !py-2 text-[13px]">
                <CheckCircle size={14} />
                Close ticket
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card card-body">
        <Thread messages={visible} viewerRole="USER" />
      </div>

      {closed ? (
        <div className="card flex items-center gap-2.5 px-5 py-4 text-sm text-zinc-500">
          <Lock size={15} className="text-zinc-400" />
          This ticket is closed. Need more help?{" "}
          <Link href="/dashboard/support/new" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Open a new ticket
          </Link>
          .
        </div>
      ) : (
        <div className="card card-body">
          <ReplyForm action={replyToTicket.bind(null, ticket.id)} />
        </div>
      )}
    </div>
  )
}
