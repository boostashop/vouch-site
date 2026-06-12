"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { Zap, ChevronDown, Trash2, Loader2, Ban, RotateCcw } from "lucide-react"
import { grantPremium, deleteUser, toggleUserPremium, banUser, unbanUser } from "@/app/admin/actions"

const GRANT_OPTIONS = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "365 days", days: 365 },
  { label: "Forever", days: 0 },
]

export function PremiumControl({
  userId,
  isPremium,
  premiumExpiresAt,
}: {
  userId: string
  isPremium: boolean
  premiumExpiresAt: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const label = !isPremium
    ? "Free"
    : premiumExpiresAt
      ? `Until ${new Date(premiumExpiresAt).toLocaleDateString()}`
      : "Premium"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
          isPremium
            ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/10"
        }`}
      >
        {pending ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} fill={isPremium ? "currentColor" : "none"} />}
        {label}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
          <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Grant premium</p>
          {GRANT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setOpen(false)
                startTransition(() => grantPremium(userId, opt.days))
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              {opt.label}
            </button>
          ))}
          {isPremium && (
            <button
              onClick={() => {
                setOpen(false)
                startTransition(() => toggleUserPremium(userId, false))
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 border-t border-zinc-100 dark:border-white/5 mt-1 transition-colors"
            >
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Reversible moderation. Not banned → a "Ban" button that prompts for a reason.
// Banned → a "Banned" pill plus an "Unban" button.
export function BanControl({
  userId,
  banned,
  label,
}: {
  userId: string
  banned: boolean
  label: string
}) {
  const [pending, startTransition] = useTransition()

  if (banned) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
          Banned
        </span>
        <button
          disabled={pending}
          onClick={() => startTransition(() => unbanUser(userId))}
          title="Unban user"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/20 transition-all disabled:opacity-50"
        >
          {pending ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
          Unban
        </button>
      </div>
    )
  }

  return (
    <button
      disabled={pending}
      onClick={() => {
        const reason = prompt(`Ban ${label}? They won't be able to sign in and their public profile will be hidden.\n\nReason (optional):`)
        // prompt returns null on cancel; "" (OK with no text) still bans.
        if (reason !== null) {
          startTransition(() => banUser(userId, reason))
        }
      }}
      title="Ban user"
      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500/20 transition-all disabled:opacity-50"
    >
      {pending ? <Loader2 size={10} className="animate-spin" /> : <Ban size={10} />}
      Ban
    </button>
  )
}

export function DeleteUserButton({ userId, label }: { userId: string; label: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Permanently delete ${label} and all their vouches? This cannot be undone.`)) {
          startTransition(() => deleteUser(userId))
        }
      }}
      title="Delete user"
      className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  )
}
