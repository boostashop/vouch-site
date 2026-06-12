import { prisma } from "@/lib/prisma"
import { ScrollText, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"

const PAGE_SIZE = 50

// Visual treatment per action category.
const ACTION_STYLE: Record<string, { label: string; cls: string }> = {
  USER_BAN: { label: "Ban", cls: "bg-red-500/10 text-red-500" },
  USER_UNBAN: { label: "Unban", cls: "bg-emerald-500/10 text-emerald-500" },
  USER_DELETE: { label: "Delete user", cls: "bg-red-500/10 text-red-500" },
  PREMIUM_GRANT: { label: "Premium grant", cls: "bg-amber-500/10 text-amber-500" },
  PREMIUM_REVOKE: { label: "Premium revoke", cls: "bg-zinc-500/10 text-zinc-500" },
  ROLE_CHANGE: { label: "Role change", cls: "bg-indigo-500/10 text-indigo-500" },
  VOUCH_DELETE: { label: "Vouch delete", cls: "bg-red-500/10 text-red-500" },
  VOUCH_APPROVE: { label: "Vouch approve", cls: "bg-emerald-500/10 text-emerald-500" },
  VOUCH_REMOVE: { label: "Vouch remove", cls: "bg-orange-500/10 text-orange-500" },
  SIGNUPS_TOGGLE: { label: "Signups toggle", cls: "bg-sky-500/10 text-sky-500" },
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
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
          <ScrollText className="text-red-500" size={28} />
          Audit Log
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          {total.toLocaleString()} recorded admin action{total !== 1 ? "s" : ""} — every ban, deletion, premium grant, role change and moderation decision.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-20 text-center">
            <ShieldCheck size={40} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">No admin actions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/20">
                  <th className="px-6 py-4">When</th>
                  <th className="px-4 py-4">Admin</th>
                  <th className="px-4 py-4">Action</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                {entries.map((e) => {
                  const style = ACTION_STYLE[e.action] ?? { label: e.action, cls: "bg-zinc-500/10 text-zinc-500" }
                  return (
                    <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-300">
                          {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(e.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">
                          {e.actorEmail || e.actorId || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${style.cls}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{e.summary}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/20">
            <p className="text-xs font-medium text-zinc-500">
              Showing {from}–{to} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <a href={`/admin/audit?page=${page - 1}`} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
                  <ChevronLeft size={16} />
                </a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronLeft size={16} /></span>
              )}
              <span className="px-3 text-xs font-bold text-zinc-500">Page {page} / {totalPages}</span>
              {page < totalPages ? (
                <a href={`/admin/audit?page=${page + 1}`} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
                  <ChevronRight size={16} />
                </a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronRight size={16} /></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
