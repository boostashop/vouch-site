import { RefreshCw, Server, Database, Globe, Key, CheckCircle2 } from "lucide-react"
import { pruneStaleData } from "./actions"

export default async function AdminSettingsPage(props: {
  searchParams: Promise<{ pruned?: string }>
}) {
  const { pruned } = await props.searchParams

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Core Settings</h1>
        <p className="text-zinc-500 mt-2 font-medium">Global platform configuration and system maintenance.</p>
      </div>

      {pruned !== undefined && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} />
          <span className="text-sm font-bold">Pruned {pruned} expired row{pruned === "1" ? "" : "s"}.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
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

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Globe size={20} className="text-emerald-400" />
            Platform Config
          </h2>

          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-6">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Maintenance Mode</label>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">Operational</span>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Coming soon</span>
                </div>
             </div>

             <div className="space-y-4 pt-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Global API Access</label>
                <div className="relative group opacity-60">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-700" size={16} />
                   <input
                     type="text"
                     value="Not configured"
                     readOnly
                     className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-mono text-zinc-500 outline-none"
                   />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 px-1 italic">Shared secret for internal service communication. Coming soon.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
