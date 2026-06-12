"use client"

import { useState } from "react"
import { Star, ExternalLink, MessageSquarePlus, Trash2, RotateCcw } from "lucide-react"
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

const STATUS_CHIPS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "chip-emerald" },
  FLAGGED: { label: "Flagged", className: "chip-amber" },
  REMOVED: { label: "Removed", className: "chip-zinc" },
}

export function VouchCard({ vouch }: { vouch: Vouch }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const isRemoved = vouch.status === "REMOVED"
  const status = STATUS_CHIPS[vouch.status] || STATUS_CHIPS.ACTIVE

  return (
    <div className={`card flex flex-col gap-3.5 p-5 transition-opacity ${isRemoved ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{vouch.giverName}</span>
          <span className={vouch.platform === "discord" ? "chip-indigo" : "chip-sky"}>
            {vouch.platform === "discord" ? "Discord" : "Telegram"}
          </span>
          <span className={status.className}>{status.label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
          <span className="hidden text-xs text-zinc-400 dark:text-zinc-500 sm:block">
            {new Date(vouch.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </span>
        </div>
      </div>

      {vouch.comment && (
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">&ldquo;{vouch.comment}&rdquo;</p>
      )}

      {vouch.sellerReply && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Your reply
          </span>
          <p className="mt-0.5 leading-relaxed">&ldquo;{vouch.sellerReply}&rdquo;</p>
        </div>
      )}

      {replyOpen && (
        <form action={replyVouchAction} className="flex flex-col gap-2.5">
          <input type="hidden" name="vouchId" value={vouch.id} />
          <textarea
            name="reply"
            defaultValue={vouch.sellerReply || ""}
            rows={2}
            maxLength={1000}
            placeholder="Write a public response to this vouch…"
            className="input resize-none"
          />
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary !px-3.5 !py-2 text-[13px]">
              Save reply
            </button>
            <button type="button" onClick={() => setReplyOpen(false)} className="btn-ghost text-[13px]">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="-mb-1.5 flex flex-wrap items-center gap-1 border-t border-zinc-100 pt-2.5 dark:border-white/[0.05]">
        {!replyOpen && (
          <button onClick={() => setReplyOpen(true)} className="btn-ghost !px-2.5 !py-1.5 text-[13px]">
            <MessageSquarePlus size={14} /> {vouch.sellerReply ? "Edit reply" : "Reply"}
          </button>
        )}
        {isRemoved ? (
          <form action={restoreVouchAction}>
            <input type="hidden" name="vouchId" value={vouch.id} />
            <button className="btn-ghost !px-2.5 !py-1.5 text-[13px] !text-emerald-600 hover:!bg-emerald-500/10 dark:!text-emerald-400">
              <RotateCcw size={14} /> Restore
            </button>
          </form>
        ) : (
          <>
            {vouch.status === "FLAGGED" && (
              <form action={restoreVouchAction}>
                <input type="hidden" name="vouchId" value={vouch.id} />
                <button className="btn-ghost !px-2.5 !py-1.5 text-[13px] !text-emerald-600 hover:!bg-emerald-500/10 dark:!text-emerald-400">
                  <RotateCcw size={14} /> Approve
                </button>
              </form>
            )}
            <form action={removeVouchAction}>
              <input type="hidden" name="vouchId" value={vouch.id} />
              <button className="btn-danger-ghost !px-2.5 !py-1.5 text-[13px]">
                <Trash2 size={14} /> Remove
              </button>
            </form>
          </>
        )}
        {vouch.proofUrl && (
          <a
            href={vouch.proofUrl}
            target="_blank"
            className="btn-ghost ml-auto !px-2.5 !py-1.5 text-[13px] !text-indigo-600 hover:!bg-indigo-500/10 dark:!text-indigo-400"
          >
            View proof <ExternalLink size={12} />
          </a>
        )}
        <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500 sm:hidden">
          {new Date(vouch.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
