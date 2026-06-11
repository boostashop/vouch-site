"use client"

import { useState } from "react"
import { Star, ExternalLink, Calendar, MessageSquarePlus, Trash2, RotateCcw } from "lucide-react"
import { removeVouchAction, restoreVouchAction, replyVouchAction } from "./actions"

type Vouch = {
  id: string
  giverName: string
  platform: string
  rating: number
  comment: string | null
  status: string
  sellerReply: string | null
  createdAt: string
  proofUrl: string | null
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  FLAGGED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  REMOVED: "bg-zinc-500/10 text-zinc-500 border-zinc-400/20",
}

export function VouchCard({ vouch }: { vouch: Vouch }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const isRemoved = vouch.status === "REMOVED"

  return (
    <div
      className={`p-6 rounded-2xl border transition-all flex flex-col gap-4 shadow-sm dark:shadow-none ${
        isRemoved
          ? "bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-white/5 opacity-70"
          : "bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-zinc-900 dark:text-white">{vouch.giverName}</span>
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">
            {vouch.platform}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${STATUS_STYLES[vouch.status] || STATUS_STYLES.ACTIVE}`}>
            {vouch.status}
          </span>
        </div>
        <div className="flex items-center gap-1 text-amber-500 shrink-0">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < vouch.rating ? "currentColor" : "none"} className={i < vouch.rating ? "opacity-100" : "opacity-20"} />
          ))}
        </div>
      </div>

      {vouch.comment && <p className="text-zinc-600 dark:text-zinc-300 text-sm italic">&quot;{vouch.comment}&quot;</p>}

      {vouch.sellerReply && (
        <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Your reply</span>
          <p className="mt-1 italic">&quot;{vouch.sellerReply}&quot;</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(vouch.createdAt).toLocaleDateString()}
        </div>
        {vouch.proofUrl && (
          <a href={vouch.proofUrl} target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 transition-colors">
            View Proof <ExternalLink size={10} />
          </a>
        )}
      </div>

      {replyOpen && (
        <form action={replyVouchAction} className="flex flex-col gap-2 pt-1">
          <input type="hidden" name="vouchId" value={vouch.id} />
          <textarea
            name="reply"
            defaultValue={vouch.sellerReply || ""}
            rows={2}
            maxLength={1000}
            placeholder="Write a public response to this vouch…"
            className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
          />
          <div className="flex items-center gap-2">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95">
              Save reply
            </button>
            <button type="button" onClick={() => setReplyOpen(false)} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-white/5 -mb-1">
        {!replyOpen && (
          <button
            onClick={() => setReplyOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-2 transition-colors"
          >
            <MessageSquarePlus size={14} /> {vouch.sellerReply ? "Edit reply" : "Reply"}
          </button>
        )}
        {isRemoved ? (
          <form action={restoreVouchAction}>
            <input type="hidden" name="vouchId" value={vouch.id} />
            <button className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 px-2 py-2 transition-colors">
              <RotateCcw size={14} /> Restore
            </button>
          </form>
        ) : (
          <>
            {vouch.status === "FLAGGED" && (
              <form action={restoreVouchAction}>
                <input type="hidden" name="vouchId" value={vouch.id} />
                <button className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 px-2 py-2 transition-colors">
                  <RotateCcw size={14} /> Approve
                </button>
              </form>
            )}
            <form action={removeVouchAction}>
              <input type="hidden" name="vouchId" value={vouch.id} />
              <button className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-400 px-2 py-2 transition-colors">
                <Trash2 size={14} /> Remove
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
