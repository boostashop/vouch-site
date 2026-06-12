import { RefreshCw, Server, Database, CheckCircle2, UserPlus } from "lucide-react"
import { pruneStaleData, setSignupsPaused } from "./actions"
import { isSignupsPaused } from "@/lib/settings"

export default async function AdminSettingsPage(props: {
  searchParams: Promise<{ pruned?: string }>
}) {
  const { pruned } = await props.searchParams
  const signupsPaused = await isSignupsPaused()

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Core Settings</h1>
        <p className="text-zinc-500 mt-2 font-medium">Global platform configuration and system maintenance.</p>
      </div>

      {/* Beta access */}
      <div className="max-w-2xl space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
          <UserPlus size={20} className="text-indigo-400" />
          Beta Access
        </h2>
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                New sign-ups
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${signupsPaused ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                  {signupsPaused ? "Paused" : "Open"}
                </span>
              </h4>
              <p className="text-[11px] text-zinc-500 font-medium mt-1 max-w-md leading-relaxed">
                Kill-switch for account creation (sign-up form and magic-link for new emails). Existing users can always still sign in.
              </p>
            </div>
            <form action={async () => { "use server"; await setSignupsPaused(!signupsPaused) }}>
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                  signupsPaused
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                }`}
              >
                {signupsPaused ? "Re-open signups" : "Pause signups"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {pruned !== undefined && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} />
          <span className="text-sm font-bold">Pruned {pruned} expired row{pruned === "1" ? "" : "s"}.</span>
        </div>
      )}

      <div className="max-w-2xl">
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Server size={20} className="text-indigo-400" />
            System Maintenance
          </h2>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Bot Sync</h4>
                  <p className="text-[11px] text-zinc-500 font-medium">Bots reload tokens and config automatically every 60 seconds.</p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                Auto · 60s
              </span>
            </div>

            <form action={pruneStaleData} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/10">
                  <Database size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Prune Stale Auth Rows</h4>
                  <p className="text-[11px] text-zinc-500 font-medium">Delete expired sessions and magic-link verification tokens.</p>
                </div>
              </div>
              <button type="submit" className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 border border-zinc-200 dark:border-white/5">
                Prune
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
