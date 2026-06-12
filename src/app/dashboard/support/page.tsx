import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LifeBuoy, Plus, MessageSquare, ChevronRight, Clock } from "lucide-react"
import { STATUS_LABEL, STATUS_CHIP, CATEGORY_LABEL } from "@/lib/tickets"

export const dynamic = "force-dynamic"

function timeAgo(date: Date): string {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default async function SupportPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      subject: true,
      category: true,
      status: true,
      lastMessageAt: true,
      awaitingStaff: true,
      _count: { select: { messages: true } },
    },
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <LifeBuoy className="text-indigo-500" size={20} />
            Support
          </h1>
          <p className="page-subtitle">
            Report an issue, ask a question, or suggest a feature. We&rsquo;ll reply by email and here.
          </p>
        </div>
        <Link href="/dashboard/support/new" className="btn-primary">
          <Plus size={15} />
          New ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <LifeBuoy size={32} className="mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No tickets yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Need a hand or have an idea?{" "}
            <Link href="/dashboard/support/new" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Open your first ticket
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/support/${t.id}`}
              className="card group flex items-center gap-4 p-4 transition-colors hover:border-indigo-500/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={STATUS_CHIP[t.status]}>{STATUS_LABEL[t.status]}</span>
                  <span className="chip-zinc">{CATEGORY_LABEL[t.category]}</span>
                  {t.awaitingStaff && t.status !== "CLOSED" && (
                    <span className="chip-indigo">Awaiting reply</span>
                  )}
                </div>
                <h3 className="mt-1.5 truncate text-[14px] font-semibold text-zinc-900 dark:text-white">
                  {t.subject}
                </h3>
                <p className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={11} />
                    {t._count.messages} message{t._count.messages !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {timeAgo(t.lastMessageAt)}
                  </span>
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-zinc-300 transition-colors group-hover:text-indigo-500 dark:text-zinc-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
