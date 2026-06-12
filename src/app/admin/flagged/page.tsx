import { prisma } from "@/lib/prisma"
import {
  AlertTriangle,
  Bot,
  User,
  Calendar,
  Star,
  CheckCircle,
  Trash2,
  ShieldAlert,
} from "lucide-react"
import { approveFlaggedVouch, removeFlaggedVouch } from "./actions"

export default async function AdminFlaggedPage() {
  const flagged = await prisma.vouch.findMany({
    where: { status: "FLAGGED" },
    orderBy: { createdAt: "desc" },
    include: {
      receiver: { select: { name: true, email: true, username: true } },
      reports: { select: { reason: true, createdAt: true } },
    },
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="page-title flex items-center gap-2.5">
          <ShieldAlert className="text-red-500" size={20} />
          Flagged Content Queue
        </h1>
        <p className="page-subtitle">
          Vouches flagged by automated detection or user reports. Review each and approve or remove.
        </p>
      </div>

      {flagged.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <CheckCircle size={32} className="mb-3 text-emerald-500" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">All clear — no flagged vouches.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {flagged.map((vouch) => {
            const isAutoFlag = !!vouch.autoFlagReason
            const userReports = vouch.reports

            return (
              <div key={vouch.id} className="card space-y-4 !border-red-500/20 p-5">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-[13px] font-semibold text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04]">
                      {vouch.giverName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="mb-0.5 text-[13px] font-semibold leading-none text-zinc-900 dark:text-white">{vouch.giverName}</h4>
                      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                        via {vouch.platform}
                        <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <Calendar size={10} />
                        {new Date(vouch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isAutoFlag && (
                      <span className="chip-zinc !bg-red-500/10 !text-red-600 !ring-red-500/20 dark:!text-red-400">
                        <Bot size={10} />
                        Auto-detected
                      </span>
                    )}
                    {userReports.length > 0 && (
                      <span className="chip-amber !bg-orange-500/10 !text-orange-600 !ring-orange-500/20 dark:!text-orange-400">
                        <User size={10} />
                        {userReports.length} report{userReports.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < vouch.rating ? "currentColor" : "none"}
                          className={i < vouch.rating ? "opacity-100" : "opacity-25"}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-300">
                  &ldquo;{vouch.comment ?? <span className="text-zinc-400 dark:text-zinc-600">(no comment)</span>}&rdquo;
                </div>

                {/* Flag reasons */}
                <div className="space-y-2">
                  {isAutoFlag && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/15 bg-red-500/5 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                      <span><span className="font-semibold">Auto-flag:</span> {vouch.autoFlagReason}</span>
                    </div>
                  )}
                  {userReports.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-orange-500/15 bg-orange-500/5 px-3.5 py-2.5 text-xs text-orange-700 dark:text-orange-300">
                      <User size={14} className="mt-0.5 shrink-0 text-orange-500" />
                      <span>
                        <span className="font-semibold">User report:</span>{" "}
                        {r.reason || <em className="text-zinc-500">No reason given</em>}
                        <span className="ml-2 text-zinc-400 dark:text-zinc-600">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Receiver + actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3.5 dark:border-white/[0.05]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <User size={12} />
                    Receiver: {vouch.receiver.name || vouch.receiver.username || vouch.receiver.email}
                  </div>

                  <div className="flex items-center gap-2">
                    <form
                      action={async () => {
                        "use server"
                        await approveFlaggedVouch(vouch.id)
                      }}
                    >
                      <button className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-[13px] font-medium text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-400">
                        <CheckCircle size={14} />
                        Approve
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server"
                        await removeFlaggedVouch(vouch.id)
                      }}
                    >
                      <button className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-500 hover:text-white dark:text-red-400">
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
