"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { deleteAccount } from "./actions"

export function DangerZone() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")

  return (
    <section className="bg-white dark:bg-zinc-900/30 border border-red-500/20 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-red-500/10 bg-red-500/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="font-bold text-zinc-900 dark:text-white">Danger Zone</h2>
          <p className="text-xs text-zinc-500">Permanently delete your account and all associated data.</p>
        </div>
      </div>

      <div className="p-6">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          >
            Delete account
          </button>
        ) : (
          <form action={deleteAccount} className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              This permanently deletes your account, profile, all vouches you&apos;ve received, bot
              configuration, and connected bot tokens. <strong>This cannot be undone.</strong>
            </p>
            <div className="space-y-2">
              <label htmlFor="confirm" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Type <span className="font-mono text-red-500">DELETE</span> to confirm
              </label>
              <input
                id="confirm"
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                className="w-full max-w-xs bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={confirm.trim() !== "DELETE"}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Permanently delete
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setConfirm("") }}
                className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 transition-colors"
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
