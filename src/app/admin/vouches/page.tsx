import { prisma } from "@/lib/prisma"
import { MessageSquare, Trash2, ExternalLink, Calendar, Star, User, ShieldAlert } from "lucide-react"
import { deleteVouch } from "../actions"
import { getSignedProofUrl } from "@/lib/proof-url"

export default async function AdminVouchesPage() {
  const vouches = await prisma.vouch.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      receiver: {
        select: {
          name: true,
          email: true,
          username: true
        }
      }
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Vouch Audit</h1>
        <p className="text-zinc-500 mt-2 font-medium">Review and moderate all testimonials across the platform.</p>
      </div>

      <div className="grid gap-4">
        {vouches.length === 0 ? (
          <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-20 text-center">
             <MessageSquare size={48} className="mx-auto text-zinc-800 mb-4" />
             <p className="text-zinc-500 font-medium">No vouches found in the database.</p>
          </div>
        ) : (
          vouches.map((vouch) => (
            <div key={vouch.id} className="bg-zinc-900/30 border border-white/5 rounded-[32px] p-8 flex flex-col md:flex-row gap-8 hover:bg-zinc-900/50 transition-all group">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 border border-white/5">
                      {vouch.giverName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-none mb-1">{vouch.giverName}</h4>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        via {vouch.platform}
                        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                        <Calendar size={10} />
                        {new Date(vouch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < vouch.rating ? "currentColor" : "none"} className={i < vouch.rating ? "opacity-100" : "opacity-20"} />
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 rounded-2xl p-5 border border-white/5 italic text-sm text-zinc-300 leading-relaxed">
                  &quot;{vouch.comment}&quot;
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-white/5 text-[10px] font-bold text-zinc-400">
                         <User size={12} />
                         Target: {vouch.receiver.name || vouch.receiver.username || vouch.receiver.email}
                      </div>
                      {vouch.proofImageUrl && (
                        <a 
                          href={getSignedProofUrl(vouch.proofImageUrl) || undefined} 
                          target="_blank" 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                        >
                          <ExternalLink size={12} />
                          View Proof
                        </a>
                      )}
                   </div>

                   <form action={async () => {
                     'use server'
                     await deleteVouch(vouch.id)
                   }}>
                     <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 transition-all text-xs font-bold">
                       <Trash2 size={14} />
                       Delete
                     </button>
                   </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
