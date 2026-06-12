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
        className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset transition-colors ${
          isPremium
            ? "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400"
            : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        {pending ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} fill={isPremium ? "currentColor" : "none"} />}
        {label}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-xl shadow-black/5 animate-in fade-in zoom-in-95 duration-100 dark:border-white/10 dark:bg-[#141416] dark:shadow-black/40">
          <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Grant premium</p>
          {GRANT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setOpen(false)
                startTransition(() => grantPremium(userId, opt.days))
              }}
              className="w-full px-3 py-1.5 text-left text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
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
              className="mt-1 w-full border-t border-zinc-100 px-3 py-1.5 text-left text-[13px] font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:border-white/[0.06] dark:text-red-400"
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
      <button
        disabled={pending}
        onClick={() => startTransition(() => unbanUser(userId))}
        title="Unban user"
        className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset ring-zinc-500/20 bg-zinc-500/10 text-zinc-500 transition-colors hover:text-emerald-600 hover:ring-emerald-500/25 disabled:opacity-50 dark:hover:text-emerald-400"
      >
        {pending ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
        Unban
      </button>
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
      className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset ring-zinc-500/20 bg-zinc-500/10 text-zinc-500 transition-colors hover:text-red-600 hover:ring-red-500/25 disabled:opacity-50 dark:hover:text-red-400"
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
      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  )
}
