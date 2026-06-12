import { RefreshCw, Server, Database, CheckCircle2, UserPlus } from "lucide-react"
import { pruneStaleData, setSignupsPaused } from "./actions"
import { isSignupsPaused } from "@/lib/settings"

export default async function AdminSettingsPage(props: {
  searchParams: Promise<{ pruned?: string }>
}) {
  const { pruned } = await props.searchParams
  const signupsPaused = await isSignupsPaused()

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="page-title">Core Settings</h1>
        <p className="page-subtitle">Global platform configuration and system maintenance.</p>
      </div>

      {pruned !== undefined && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={16} />
          <span className="text-[13px] font-medium">Pruned {pruned} expired row{pruned === "1" ? "" : "s"}.</span>
        </div>
      )}

      {/* Beta access */}
      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="card-icon">
            <UserPlus size={15} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="card-title">Beta Access</h2>
            <p className="card-subtitle">Control account creation across the platform.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900 dark:text-white">
                New sign-ups
                <span className={signupsPaused ? "chip-zinc !bg-red-500/10 !text-red-600 !ring-red-500/20 dark:!text-red-400" : "chip-emerald"}>
                  {signupsPaused ? "Paused" : "Open"}
                </span>
              </h4>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
                Kill-switch for account creation (sign-up form and magic-link for new emails). Existing users can always still sign in.
              </p>
            </div>
            <form action={async () => { "use server"; await setSignupsPaused(!signupsPaused) }}>
              <button
                type="submit"
                className={`inline-flex shrink-0 items-center rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors active:scale-[0.98] ${
                  signupsPaused
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                }`}
              >
                {signupsPaused ? "Re-open signups" : "Pause signups"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* System maintenance */}
      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="card-icon">
            <Server size={15} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="card-title">System Maintenance</h2>
            <p className="card-subtitle">Background sync status and cleanup tasks.</p>
          </div>
        </div>
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3.5">
              <div className="card-icon">
                <RefreshCw size={15} className="text-indigo-500" />
              </div>
              <div>
                <h4 className="card-title">Bot Sync</h4>
                <p className="card-subtitle mt-0.5">Bots reload tokens and config automatically every 60 seconds.</p>
              </div>
            </div>
            <span className="chip-emerald shrink-0">Auto · 60s</span>
          </div>

          <form action={pruneStaleData} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3.5">
              <div className="card-icon">
                <Database size={15} className="text-red-500" />
              </div>
              <div>
                <h4 className="card-title">Prune Stale Auth Rows</h4>
                <p className="card-subtitle mt-0.5">Delete expired sessions and magic-link verification tokens.</p>
              </div>
            </div>
            <button type="submit" className="btn-secondary shrink-0 !py-2 text-[13px]">
              Prune
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
