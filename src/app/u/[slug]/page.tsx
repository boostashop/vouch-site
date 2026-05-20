import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Calendar,
  User as UserIcon,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface PublicProfileProps {
  params: Promise<{ slug: string }>
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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
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
                   <ShieldCheck size={14} className="text-indigo-400" />
                   Verified Profile
                </span>
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
               className="bg-white text-black px-6 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2"
             >
               Get Your Own Bot
               <ExternalLink size={16} />
             </Link>
          </div>
        </header>

        {/* Vouches Feed */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h2 className="text-xl font-bold">Wall of Vouches</h2>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Latest Activity
            </div>
          </div>

          {user.vouchesReceived.length === 0 ? (
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-12 text-center">
               <p className="text-zinc-500">No vouches recorded yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {user.vouchesReceived.map((vouch) => (
                <div key={vouch.id} className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-bold border border-white/5">
                        {vouch.giverName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{vouch.giverName}</h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                           <Calendar size={12} />
                           {new Date(vouch.createdAt).toLocaleDateString()}
                           <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                           via {vouch.platform}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold">{vouch.rating}</span>
                    </div>
                  </div>

                  <p className="text-zinc-300 leading-relaxed">
                    {vouch.comment}
                  </p>

                  {vouch.proofImageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/50">
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

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-white/5 text-center space-y-4">
           <div className="flex items-center justify-center gap-2 text-zinc-600 text-sm">
             <ShieldCheck size={16} />
             Powered by VouchSite Engine
           </div>
           <p className="text-[10px] text-zinc-700 uppercase tracking-[0.2em]">
             &copy; 2026 VouchSite. All Rights Reserved.
           </p>
        </footer>
      </div>
    </div>
  )
}
