import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Calendar,
  User as UserIcon,
  ExternalLink,
  Award,
  Zap
} from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"

interface PublicProfileProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PublicProfileProps): Promise<Metadata> {
  const { slug } = await params
  const user = await prisma.user.findUnique({
    where: { slug },
    select: { name: true, profileMetaTitle: true, profileMetaDescription: true }
  })

  if (!user) return { title: "Profile Not Found" }

  return {
    title: user.profileMetaTitle || `${user.name || "User"}'s Vouch Profile | VouchSite`,
    description: user.profileMetaDescription || `View verified vouches and reputation for ${user.name || "this user"} on VouchSite.`,
  }
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const { slug } = await params
  
  const user = await prisma.user.findUnique({
    where: { slug },
    include: {
      vouchesReceived: {
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { vouchesReceived: true }
      }
    }
  })

  if (!user) {
    notFound()
  }

  const vouchCount = user._count.vouchesReceived
  const avgRating = vouchCount > 0 
    ? user.vouchesReceived.reduce((acc: number, v: any) => acc + v.rating, 0) / vouchCount 
    : 0

  const accentColor = user.profileAccentColor || "#6366f1"
  const isGlass = user.profileTheme === 'glass'

  return (
    <div className={`min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30 ${user.profileTheme === 'light' ? 'bg-zinc-50 text-black' : ''}`}>
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] blur-[120px] rounded-full opacity-20" 
          style={{ backgroundColor: accentColor }}
        />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-6">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl border ${isGlass ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-zinc-900 border-white/10'}`}>
              {user.image ? (
                <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-zinc-700" />
              )}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {user.name || "Anonymous User"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-1.5 bg-zinc-900/50 border border-white/5 px-3 py-1 rounded-full text-xs font-bold">
                   <ShieldCheck size={14} style={{ color: accentColor }} />
                   Verified Profile
                </span>
                {user.isPremium && (
                  <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
                    <Zap size={14} fill="currentColor" />
                    Premium member
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm">
                   <MessageSquare size={14} />
                   {vouchCount} Vouches
                </span>
                {vouchCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-amber-400 font-bold">
                    <Star size={14} fill="currentColor" />
                    {avgRating.toFixed(1)} Rating
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Link 
               href="/"
               className="bg-white text-black px-8 py-4 rounded-2xl text-sm font-extrabold hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-white/5"
             >
               Create Your Profile
               <ExternalLink size={16} />
             </Link>
          </div>
        </header>

        {/* Stats Grid - New */}
        {user.profileShowStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
             <StatMini label="Vouches" value={vouchCount} />
             <StatMini label="Rating" value={`${avgRating.toFixed(1)}/5`} />
             <StatMini label="Platform" value={user.discordBotToken ? 'Discord' : 'Web'} />
             <StatMini label="Rank" value={vouchCount > 100 ? 'Top Tier' : 'Growing'} />
          </div>
        )}

        {/* Vouches Feed */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h2 className="text-xl font-bold">Wall of Vouches</h2>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Latest Activity
            </div>
          </div>

          {user.vouchesReceived.length === 0 ? (
            <div className={`border border-white/5 rounded-3xl p-12 text-center ${isGlass ? 'bg-white/5 backdrop-blur-xl' : 'bg-zinc-900/20'}`}>
               <p className="text-zinc-500 font-medium">No vouches recorded yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {user.vouchesReceived.map((vouch) => (
                <div key={vouch.id} className={`border border-white/5 rounded-[32px] p-6 md:p-8 space-y-6 hover:border-white/10 transition-all group ${isGlass ? 'bg-white/5 backdrop-blur-xl hover:bg-white/[0.08]' : 'bg-zinc-900/30 hover:bg-zinc-900/50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-lg font-bold border border-white/5 group-hover:scale-105 transition-transform">
                        {vouch.giverName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{vouch.giverName}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-wider">
                           <Calendar size={10} />
                           {new Date(vouch.createdAt).toLocaleDateString()}
                           <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                           {vouch.platform}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-black">{vouch.rating}</span>
                    </div>
                  </div>

                  <p className="text-zinc-300 leading-relaxed font-medium">
                    {vouch.comment}
                  </p>

                  {vouch.proofImageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/50 group-hover:border-white/10 transition-colors">
                      <img 
                        src={vouch.proofImageUrl} 
                        alt="Proof" 
                        className="w-full max-h-[400px] object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges Section - New */}
        {user.profileShowBadges && vouchCount > 0 && (
          <div className="mt-20 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
             <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em]">Earned Awards</h3>
             <div className="flex flex-wrap gap-4">
                <Badge icon={<Award size={16} />} label="Early Adopter" color="#10b981" />
                {vouchCount >= 10 && <Badge icon={<Star size={16} />} label="10+ Vouches" color="#f59e0b" />}
                {vouchCount >= 50 && <Badge icon={<ShieldCheck size={16} />} label="Trusted Seller" color="#6366f1" />}
             </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-white/5 text-center space-y-6 opacity-50 hover:opacity-100 transition-opacity">
           <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm font-bold">
             <ShieldCheck size={16} style={{ color: accentColor }} />
             Reputation verified by VouchSite
           </div>
           <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black">
             &copy; 2026 VouchSite. All Rights Reserved.
           </p>
        </footer>
      </div>
    </div>
  )
}

function StatMini({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 text-center">
      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  )
}

function Badge({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold text-white group hover:border-white/10 transition-colors">
      <span style={{ color }}>{icon}</span>
      {label}
    </div>
  )
}

