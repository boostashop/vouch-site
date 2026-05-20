import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  MessageSquare, 
  ShieldCheck, 
  ExternalLink,
  Zap,
  ArrowRight,
  Shield,
  Bot,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: { vouchesReceived: true }
      }
    }
  })

  const vouchCount = user?._count.vouchesReceived || 0;
  const isPremium = user?.isPremium || false;
  const hasBot = !!user?.discordBotToken;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Hello, {session?.user?.name || 'Builder'} <span className="inline-block animate-bounce-slow">👋</span>
          </h1>
          <p className="text-zinc-400 mt-2 font-medium">Your reputation engine is {hasBot ? 'active and monitoring.' : 'awaiting configuration.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/bot" 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20 w-full md:w-auto"
          >
            <Bot size={18} />
            Manage Bot
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          icon={<MessageSquare className="text-indigo-400" />}
          label="Total Vouches"
          value={vouchCount}
          description="Verified testimonials"
          trend="+0 this week"
          color="indigo"
        />
        <StatCard 
          icon={<ShieldCheck className="text-emerald-400" />}
          label="Account Status"
          value={isPremium ? "Premium" : "Free"}
          description={isPremium ? "Unlimited Storage" : `${vouchCount}/50 Limit`}
          trend={isPremium ? "Active" : "Upgrade"}
          color="emerald"
        />
        <StatCard 
          icon={<Zap className={hasBot ? "text-amber-400" : "text-zinc-500"} />}
          label="System Health"
          value={hasBot ? "Online" : "Offline"}
          description={hasBot ? "Bot is listening" : "No token provided"}
          trend={hasBot ? "Stable" : "Action Req."}
          color={hasBot ? "amber" : "zinc"}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Recent Activity
            </h2>
            <Link href="/dashboard/vouches" className="text-indigo-400 text-sm font-bold hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
               <MessageSquare size={32} className="text-zinc-700" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">No vouches found</h3>
             <p className="text-sm text-zinc-500 max-w-[240px] leading-relaxed">
               Once your bot is connected and receiving feedback, they will appear here.
             </p>
             <Link href="/dashboard/bot" className="mt-8 text-sm font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30 transition-colors">
               Setup your first bot →
             </Link>
          </div>
        </div>

        {/* Action Center / Tips */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold">Action Center</h2>
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
            <ActionItem 
              icon={<Bot className="text-indigo-400" />}
              title="Connect Discord"
              description="Link your custom bot token to start collecting vouches."
              href="/dashboard/bot"
              status={hasBot ? "done" : "pending"}
            />
            <ActionItem 
              icon={<ExternalLink className="text-sky-400" />}
              title="Share Profile"
              description="Your public profile is ready at your-slug.vouchsite.es"
              href="/dashboard/profile"
              status="pending"
            />
            <ActionItem 
              icon={<Shield className="text-purple-400" />}
              title="Enable Protection"
              description="Upgrade to Premium for unlimited storage and custom domains."
              href="/dashboard/billing"
              status="pending"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  description, 
  trend,
  color
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string | number, 
  description: string,
  trend: string,
  color: string
}) {
  const colorMap: Record<string, string> = {
    indigo: "border-indigo-500/10 hover:border-indigo-500/20",
    emerald: "border-emerald-500/10 hover:border-emerald-500/20",
    amber: "border-amber-500/10 hover:border-amber-500/20",
    zinc: "border-white/5 hover:border-white/10"
  };

  return (
    <div className={`p-6 rounded-3xl bg-zinc-900/30 border ${colorMap[color]} transition-all group`}>
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-lg border border-white/5">
          {trend}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-zinc-400">{label}</p>
        <h4 className="text-3xl font-extrabold tracking-tight text-white">{value}</h4>
        <p className="text-xs font-medium text-zinc-600 mt-2">{description}</p>
      </div>
    </div>
  )
}

function ActionItem({ 
  icon, 
  title, 
  description, 
  href, 
  status 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  href: string, 
  status: "done" | "pending" 
}) {
  return (
    <Link href={href} className="flex gap-4 group p-2 rounded-2xl hover:bg-white/[0.02] transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{title}</h4>
          {status === "done" && <CheckCircle size={14} className="text-emerald-500" />}
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{description}</p>
      </div>
    </Link>
  )
}
