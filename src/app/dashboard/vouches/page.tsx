import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MessageSquare, Star, ExternalLink, Calendar } from "lucide-react"

export default async function VouchesPage() {
  const session = await auth()
  const vouches = await prisma.vouch.findMany({
    where: { receiverId: session?.user?.id },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Your Vouches</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review and manage all testimonials collected by your bots.</p>
      </div>

      {vouches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-900/10 shadow-inner">
          <MessageSquare size={64} className="mb-4 opacity-10" />
          <h3 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">No vouches yet</h3>
          <p className="text-sm max-w-xs text-center mt-2 leading-relaxed">
            Your vouches will appear here automatically once your bot is connected and users start leaving feedback.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {vouches.map((vouch: any) => (
            <div key={vouch.id} className="p-6 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all flex flex-col md:flex-row gap-6 shadow-sm dark:shadow-none">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-white">{vouch.giverName}</span>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">{vouch.platform}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < vouch.rating ? "currentColor" : "none"} className={i < vouch.rating ? "opacity-100" : "opacity-20"} />
                    ))}
                  </div>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm italic">&quot;{vouch.comment}&quot;</p>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                   <div className="flex items-center gap-1">
                     <Calendar size={12} />
                     {new Date(vouch.createdAt).toLocaleDateString()}
                   </div>
                   {vouch.proofImageUrl && (
                     <a href={vouch.proofImageUrl} target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                       View Proof <ExternalLink size={10} />
                     </a>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
