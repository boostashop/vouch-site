"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { deleteAccount } from "./actions"

export function DangerZone() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")

  return (
    <section className="card overflow-hidden !border-red-500/25">
      <div className="card-header !border-red-500/10 bg-red-500/[0.04]">
        <div className="card-icon !border-red-500/20 !bg-red-500/10 !text-red-500">
          <AlertTriangle size={15} />
        </div>
        <div>
          <h2 className="card-title">Danger Zone</h2>
          <p className="card-subtitle">Permanently delete your account and all associated data.</p>
        </div>
      </div>

      <div className="card-body">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-600 transition-all hover:bg-red-500/20 active:scale-[0.98] dark:text-red-400"
          >
            Delete account
          </button>
        ) : (
          <form action={deleteAccount} className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              This permanently deletes your account, profile, all vouches you&apos;ve received, bot
              configuration, and connected bot tokens. <strong>This cannot be undone.</strong>
            </p>
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="field-label">
                Type <span className="font-mono font-semibold text-red-500">DELETE</span> to confirm
              </label>
              <input
                id="confirm"
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                className="input max-w-xs font-mono focus:!border-red-500/70 focus:!ring-red-500/15"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={confirm.trim() !== "DELETE"}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Permanently delete
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setConfirm("") }}
                className="btn-ghost text-[13px]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
