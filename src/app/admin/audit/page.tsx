import { prisma } from "@/lib/prisma"
import { ScrollText, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"

const PAGE_SIZE = 50

// Visual treatment per action category.
const ACTION_STYLE: Record<string, { label: string; cls: string }> = {
  USER_BAN: { label: "Ban", cls: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400" },
  USER_UNBAN: { label: "Unban", cls: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400" },
  USER_DELETE: { label: "Delete user", cls: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400" },
  PREMIUM_GRANT: { label: "Premium grant", cls: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400" },
  PREMIUM_REVOKE: { label: "Premium revoke", cls: "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20" },
  ROLE_CHANGE: { label: "Role change", cls: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-400" },
  VOUCH_DELETE: { label: "Vouch delete", cls: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400" },
  VOUCH_APPROVE: { label: "Vouch approve", cls: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400" },
  VOUCH_REMOVE: { label: "Vouch remove", cls: "bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-400" },
  SIGNUPS_TOGGLE: { label: "Signups toggle", cls: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400" },
}

export default async function AdminAuditPage(props: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await props.searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [total, entries] = await Promise.all([
    prisma.adminAuditLog.count(),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="page-title flex items-center gap-2.5">
          <ScrollText className="text-red-500" size={20} />
          Audit Log
        </h1>
        <p className="page-subtitle">
          {total.toLocaleString()} recorded admin action{total !== 1 ? "s" : ""} — every ban, deletion, premium grant, role change and moderation decision.
        </p>
      </div>

      <div className="card overflow-hidden">
        {entries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShieldCheck size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-500">No admin actions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-500">
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
                {entries.map((e) => {
                  const style = ACTION_STYLE[e.action] ?? { label: e.action, cls: "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20" }
                  return (
                    <tr key={e.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-3">
                        <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-300">
                          {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {new Date(e.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-[13px] font-medium text-zinc-900 dark:text-white">
                          {e.actorEmail || e.actorId || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset ${style.cls}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[13px] text-zinc-600 dark:text-zinc-400">{e.summary}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <p className="text-xs text-zinc-500">
              Showing {from}–{to} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <a href={`/admin/audit?page=${page - 1}`} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  <ChevronLeft size={15} />
                </a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronLeft size={15} /></span>
              )}
              <span className="px-3 text-xs font-medium text-zinc-500">Page {page} / {totalPages}</span>
              {page < totalPages ? (
                <a href={`/admin/audit?page=${page + 1}`} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  <ChevronRight size={15} />
                </a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronRight size={15} /></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
