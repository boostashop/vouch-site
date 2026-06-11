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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={28} />
          Flagged Content Queue
        </h1>
        <p className="text-zinc-500 mt-2 font-medium">
          Vouches flagged by automated detection or user reports. Review each and approve or remove.
        </p>
      </div>

      {flagged.length === 0 ? (
        <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-20 text-center">
          <CheckCircle size={48} className="mx-auto text-emerald-600 mb-4" />
          <p className="text-zinc-400 font-semibold text-lg">All clear — no flagged vouches.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {flagged.map((vouch) => {
            const isAutoFlag = !!vouch.autoFlagReason
            const userReports = vouch.reports

            return (
              <div
                key={vouch.id}
                className="bg-zinc-900/30 border border-red-500/20 rounded-[32px] p-8 space-y-5 hover:bg-zinc-900/50 transition-all"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 border border-white/5">
                      {vouch.giverName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-none mb-1">{vouch.giverName}</h4>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        via {vouch.platform}
                        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                        <Calendar size={10} />
                        {new Date(vouch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isAutoFlag && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400">
                        <Bot size={10} />
                        Auto-detected
                      </span>
                    )}
                    {userReports.length > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest text-orange-400">
                        <User size={10} />
                        {userReports.length} user report{userReports.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < vouch.rating ? "currentColor" : "none"}
                          className={i < vouch.rating ? "opacity-100" : "opacity-20"}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-black/20 rounded-2xl p-5 border border-white/5 italic text-sm text-zinc-300 leading-relaxed">
                  &quot;{vouch.comment ?? <span className="text-zinc-600">(no comment)</span>}&quot;
                </div>

                {/* Flag reasons */}
                <div className="space-y-2">
                  {isAutoFlag && (
                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-red-300">
                      <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <span><span className="font-bold">Auto-flag:</span> {vouch.autoFlagReason}</span>
                    </div>
                  )}
                  {userReports.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-4 py-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs text-orange-300"
                    >
                      <User size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>
                        <span className="font-bold">User report:</span>{" "}
                        {r.reason || <em className="text-zinc-500">No reason given</em>}
                        <span className="ml-2 text-zinc-600">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Receiver + actions */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-white/5 text-[10px] font-bold text-zinc-400">
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
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/10 transition-all text-xs font-bold">
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
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 transition-all text-xs font-bold">
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
