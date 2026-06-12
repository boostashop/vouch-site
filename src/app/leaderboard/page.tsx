import { prisma } from "@/lib/prisma"
import { ShieldCheck, MessageSquare, Star, Trophy, Award, TrendingUp, User as UserIcon, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"
import { hasActivePremium } from "@/lib/premium"

// Same freshness as the landing page: rebuilt at most every 5 minutes and
// served from the edge cache, instead of hitting the DB on every request.
export const revalidate = 300

export default async function LeaderboardPage() {
  // Aggregate the top 50 receivers in the DB (count + avg rating), instead of
  // pulling every user and every rating row into memory.
  const top = await prisma.vouch.groupBy({
    by: ["receiverId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    _avg: { rating: true },
    orderBy: { _count: { receiverId: "desc" } },
    take: 50,
  })

  const users = await prisma.user.findMany({
    // Exclude banned users — rankedUsers drops any receiverId without a matching
    // row, so a banned profile simply disappears from the board.
    where: { id: { in: top.map((t) => t.receiverId) }, bannedAt: null },
    select: {
      id: true,
      name: true,
      username: true,
      slug: true,
      image: true,
      isPremium: true,
      premiumExpiresAt: true,
    },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  // Preserve the groupBy ordering (already sorted by vouch count desc).
  const rankedUsers = top.flatMap((t) => {
    const user = userMap.get(t.receiverId)
    if (!user) return []
    return [{
      ...user,
      totalVouches: t._count._all,
      avgRating: t._avg.rating ?? 0,
      premium: hasActivePremium(user),
    }]
  })

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <LogoMark size={32} className="rounded-lg group-hover:scale-105 transition-transform shadow-lg shadow-indigo-600/20" />
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Vouched.to</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-white transition-colors mr-4">Home</Link>
              <ThemeToggle />
              <Link href="/auth/signin" className="bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
             <Trophy size={14} />
             Global Rankings
           </div>
           <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white">
             The Reputation <br /> Leaderboard
           </h1>
           <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto font-medium">
             Discover the most trusted builders and service providers on the platform. Ranked by verified testimonials.
           </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 items-end">
           {rankedUsers.slice(0, 3).map((user, i) => (
             <PodiumCard key={user.id} user={user} rank={i + 1} />
           ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm dark:shadow-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
           <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-6 border-b border-zinc-200 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-6">User</div>
              <div className="col-span-2 text-center">Rating</div>
              <div className="col-span-3 text-right">Total Vouches</div>
           </div>

           <div className="divide-y divide-zinc-200 dark:divide-white/5">
              {rankedUsers.length > 0 ? (
                rankedUsers.map((user, i) => (
                  <Link 
                    key={user.id} 
                    href={user.slug ? `/u/${user.slug}` : "#"}
                    className={`grid grid-cols-12 gap-4 px-6 md:px-8 py-6 items-center hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all group ${!user.slug ? 'pointer-events-none cursor-default' : ''}`}
                  >
                    <div className="col-span-2 md:col-span-1 text-center font-black text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      #{i + 1}
                    </div>
                    <div className="col-span-7 md:col-span-6 flex items-center gap-4">
                       <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-white/5 group-hover:scale-105 transition-transform overflow-hidden shadow-inner">
                          {user.image ? (
                            <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={18} className="text-zinc-400 dark:text-zinc-600" />
                          )}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <p className="font-black text-zinc-900 dark:text-white text-sm md:text-base truncate max-w-[120px] md:max-w-none">
                               {user.name || user.username}
                             </p>
                             {user.premium && <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 font-bold">{user.slug ? `/u/${user.slug}` : "No public profile"}</p>
                       </div>
                    </div>
                    <div className="hidden md:flex col-span-2 justify-center">
                       <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-500 text-xs font-black">
                          <Star size={12} fill="currentColor" />
                          {user.avgRating.toFixed(1)}
                       </div>
                    </div>
                    <div className="col-span-3 text-right">
                       <div className="inline-flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          <span className="font-black text-zinc-900 dark:text-white text-lg md:text-xl">{user.totalVouches}</span>
                          <ArrowRight size={14} className="text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-all" />
                       </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                   <MessageSquare size={48} className="mx-auto text-zinc-200 dark:text-zinc-800" />
                   <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No rankings available yet</p>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-zinc-200 dark:border-white/5 text-center">
         <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em]">
           Verified by Vouched.to Reputation Engine
         </p>
      </footer>
    </div>
  )
}

function PodiumCard({ user, rank }: { user: any, rank: number }) {
  const rankColors = {
    1: "from-amber-400/20 to-amber-600/5 border-amber-500/20 h-[380px]",
    2: "from-zinc-400/20 to-zinc-600/5 border-zinc-500/20 h-[340px]",
    3: "from-orange-400/20 to-orange-600/5 border-orange-500/20 h-[300px]"
  }

  const rankIcons = {
    1: <Trophy className="text-amber-500" size={32} />,
    2: <Award className="text-zinc-400" size={32} />,
    3: <Award className="text-orange-400" size={32} />
  }

  // Handle case where rankedUsers might be shorter than 3
  if (!user) return null;

  return (
    <div className={`relative rounded-[40px] border-2 bg-gradient-to-b p-8 flex flex-col items-center justify-center text-center shadow-xl transition-all hover:scale-105 hover:shadow-2xl overflow-hidden group ${rankColors[rank as keyof typeof rankColors]}`}>
       <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          {rankIcons[rank as keyof typeof rankIcons]}
       </div>

       <div className="relative mb-6">
          <div className={`w-24 h-24 md:w-28 md:h-28 rounded-[36px] bg-white dark:bg-zinc-800 p-1.5 shadow-2xl transition-transform group-hover:rotate-3`}>
             <div className="w-full h-full rounded-[30px] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <UserIcon size={32} />
                  </div>
                )}
             </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-lg shadow-xl">
             #{rank}
          </div>
       </div>

       <div className="space-y-2 mb-8">
          <h3 className="font-black text-xl text-zinc-900 dark:text-white truncate max-w-[160px]">
            {user.name || user.username}
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-amber-500 text-xs font-black">
             <Star size={12} fill="currentColor" />
             {user.avgRating.toFixed(1)} / 5.0
          </div>
       </div>

       <div className="w-full space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 border-t border-zinc-200 dark:border-white/10 pt-4">
             <span>Vouches</span>
             <span className="text-zinc-900 dark:text-white text-lg">{user.totalVouches}</span>
          </div>
          <Link 
            href={user.slug ? `/u/${user.slug}` : "#"}
            className={`w-full block py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 ${!user.slug ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {user.slug ? "View Profile" : "No Profile"}
          </Link>
       </div>
    </div>
  )
}
