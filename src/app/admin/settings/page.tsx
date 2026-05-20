import { ShieldAlert, RefreshCw, Server, Database, Globe, Key } from "lucide-react"

export default async function AdminSettingsPage() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Core Settings</h1>
        <p className="text-zinc-500 mt-2 font-medium">Global platform configuration and system maintenance.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Server size={20} className="text-indigo-400" />
            System Maintenance
          </h2>
          
          <div className="bg-zinc-900/30 border border-white/5 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Global Bot Sync</h4>
                  <p className="text-[11px] text-zinc-500 font-medium">Force all active bots to reload their configuration.</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all active:scale-95">
                Execute
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/10">
                  <Database size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Prune Stale Sessions</h4>
                  <p className="text-[11px] text-zinc-500 font-medium">Clear expired authentication sessions from the database.</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 transition-all active:scale-95 border border-white/5">
                Prune
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe size={20} className="text-emerald-400" />
            Platform Config
          </h2>
          
          <div className="bg-zinc-900/30 border border-white/5 rounded-[32px] p-8 space-y-6">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Maintenance Mode</label>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-bold text-white">Operational</span>
                   </div>
                   <button className="text-xs font-bold text-red-500 hover:underline transition-all">
                      Enable Maintenance
                   </button>
                </div>
             </div>

             <div className="space-y-4 pt-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Global API Access</label>
                <div className="relative group">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-emerald-500 transition-colors" size={16} />
                   <input 
                     type="password" 
                     value="••••••••••••••••"
                     readOnly
                     className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-mono text-zinc-500 outline-none"
                   />
                </div>
                <p className="text-[10px] text-zinc-600 px-1 italic">Shared secret for internal service communication.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
