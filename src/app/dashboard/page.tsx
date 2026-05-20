import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp, 
  PlusCircle,
  ExternalLink,
  Zap
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: { vouchesReceived: true }
      }
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-zinc-400 mt-1">Welcome back, {session?.user?.name}. Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/bot" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <PlusCircle size={16} />
            Connect Bot
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<MessageSquare className="text-indigo-400" />}
          label="Total Vouches"
          value={user?._count.vouchesReceived || 0}
          description="Across all platforms"
        />
        <StatCard 
          icon={<ShieldCheck className="text-green-400" />}
          label="Plan Status"
          value={user?.isPremium ? "Premium" : "Free Tier"}
          description={user?.isPremium ? "Unlimited Storage" : `${user?._count.vouchesReceived || 0}/50 Vouches used`}
        />
        <StatCard 
          icon={<Zap className="text-yellow-400" />}
          label="Active Bot"
          value={user?.discordBotToken ? "Online" : "None"}
          description={user?.discordBotToken ? "Listening for commands" : "Setup required"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Vouches Placeholder */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Vouches</h2>
            <Link href="/dashboard/vouches" className="text-indigo-400 text-sm hover:underline flex items-center gap-1">
              View all <ExternalLink size={12} />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600 border border-dashed border-white/10 rounded-xl">
             <MessageSquare size={48} className="mb-4 opacity-20" />
             <p className="text-sm">No vouches found yet.</p>
             <p className="text-xs mt-1">Vouches will appear here once your bot is setup.</p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Quick Start Guide</h2>
          <div className="space-y-4">
            <TipItem 
              step="1"
              title="Create a Discord Bot"
              description="Head to the Discord Developer Portal and create a new application."
            />
            <TipItem 
              step="2"
              title="Get Your Token"
              description="Copy your bot token and paste it in the Bot Settings tab."
            />
            <TipItem 
              step="3"
              title="Invite to Server"
              description="Use the generated OAuth2 link to invite the bot to your server."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, description }: { icon: React.ReactNode, label: string, value: string | number, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium text-zinc-400">{label}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        <span className="text-xs text-zinc-500 mt-1">{description}</span>
      </div>
    </div>
  )
}

function TipItem({ step, title, description }: { step: string, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
        {step}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
