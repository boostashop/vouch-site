import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { LifeBuoy, MessageSquare, Clock, ChevronRight, Inbox } from "lucide-react"
import type { Prisma } from "@prisma/client"
import { STATUS_LABEL, STATUS_CHIP, CATEGORY_LABEL, PRIORITY_LABEL, PRIORITY_CHIP } from "@/lib/tickets"

export const dynamic = "force-dynamic"

function timeAgo(date: Date): string {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting", label: "Awaiting reply" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
]

function whereFor(filter: string): Prisma.SupportTicketWhereInput {
  if (filter === "awaiting") return { awaitingStaff: true, status: { not: "CLOSED" } }
  if (["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(filter)) {
    return { status: filter as never }
  }
  return {}
}

export default async function AdminSupportPage(props: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = "all" } = await props.searchParams
  const where = whereFor(filter)

  const [tickets, awaitingCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ awaitingStaff: "desc" }, { lastMessageAt: "desc" }],
      take: 100,
      select: {
        id: true,
        subject: true,
        category: true,
        status: true,
        priority: true,
        lastMessageAt: true,
        awaitingStaff: true,
        user: { select: { name: true, username: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where: { awaitingStaff: true, status: { not: "CLOSED" } } }),
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="page-title flex items-center gap-2.5">
          <LifeBuoy className="text-indigo-500" size={20} />
          Support Queue
        </h1>
        <p className="page-subtitle">
          {awaitingCount > 0
            ? `${awaitingCount} ticket${awaitingCount !== 1 ? "s" : ""} awaiting a reply.`
            : "Nothing waiting on staff — you're all caught up."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/support" : `/admin/support?filter=${f.key}`}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {tickets.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <Inbox size={32} className="mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No tickets here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/admin/support/${t.id}`}
              className={`card group flex items-center gap-4 p-4 transition-colors hover:border-indigo-500/30 ${
                t.awaitingStaff && t.status !== "CLOSED" ? "!border-indigo-500/25" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={STATUS_CHIP[t.status]}>{STATUS_LABEL[t.status]}</span>
                  {t.priority !== "NORMAL" && (
                    <span className={PRIORITY_CHIP[t.priority]}>{PRIORITY_LABEL[t.priority]}</span>
                  )}
                  <span className="chip-zinc">{CATEGORY_LABEL[t.category]}</span>
                  {t.awaitingStaff && t.status !== "CLOSED" && (
                    <span className="chip-indigo">Awaiting reply</span>
                  )}
                </div>
                <h3 className="mt-1.5 truncate text-[14px] font-semibold text-zinc-900 dark:text-white">
                  {t.subject}
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="truncate">
                    {t.user.name || t.user.username || t.user.email || "Unknown user"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={11} />
                    {t._count.messages}
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
