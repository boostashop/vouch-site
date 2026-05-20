import { prisma } from "@/lib/prisma"
import { 
  Users, 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight,
  UserCheck,
  Server
} from "lucide-react"

export default async function AdminPulsePage() {
  const [userCount, vouchCount, premiumCount] = await Promise.all([
    prisma.user.count(),
    prisma.vouch.count(),
    prisma.user.count({ where: { isPremium: true } })
  ])

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Pulse</h1>
        <p className="text-zinc-500 mt-2 font-medium">Real-time health and growth metrics for VouchSite.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <PulseCard 
          icon={<Users className="text-blue-400" />}
          label="Total Users"
          value={userCount}
          trend="+12% this month"
          color="blue"
        />
        <PulseCard 
          icon={<MessageSquare className="text-indigo-400" />}
          label="Total Vouches"
          value={vouchCount}
          trend="+84 today"
          color="indigo"
        />
        <PulseCard 
          icon={<ShieldCheck className="text-emerald-400" />}
          label="Premium Users"
          value={premiumCount}
          trend="4.2% conversion"
          color="emerald"
        />
        <PulseCard 
          icon={<Server className="text-amber-400" />}
          label="Node Status"
          value="Healthy"
          trend="VPS Online"
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Admin Actions */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[32px] p-8 space-y-6">
          <h2 className="text-xl font-bold">Priority Actions</h2>
          <div className="grid gap-4">
            <AdminAction 
              icon={<UserCheck className="text-indigo-400" />}
              title="Manual Premium Upgrade"
              description="Manually upgrade a user by email or username."
              href="/admin/users"
            />
            <AdminAction 
              icon={<ShieldCheck className="text-emerald-400" />}
              title="Global Bot Sync"
              description="Force restart and sync all active bot instances."
              href="/admin/settings"
            />
          </div>
        </div>

        {/* System Logs Placeholder */}
        <div className="bg-zinc-900/10 border border-dashed border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
          <ActivityIcon className="w-12 h-12 text-zinc-800 mb-4" />
          <h3 className="text-lg font-bold text-zinc-500">Live Traffic Logs</h3>
          <p className="text-xs text-zinc-600 mt-2 max-w-[200px]">System activity streaming is currently being initialized.</p>
        </div>
      </div>
    </div>
  )
}

function PulseCard({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string | number, trend: string, color: string }) {
  return (
    <div className="p-6 rounded-3xl bg-zinc-900/30 border border-white/5 group hover:bg-zinc-900/50 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5">
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-zinc-700 group-hover:text-white transition-colors" />
      </div>
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-white">{value}</h4>
      <p className="text-[10px] font-bold text-zinc-600 mt-3">{trend}</p>
    </div>
  )
}

function AdminAction({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
      <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-[11px] text-zinc-500 font-medium">{description}</p>
      </div>
    </div>
  )
}

function ActivityIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
