import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateProfile } from "./actions"
import { User, Link as LinkIcon, Shield, CheckCircle } from "lucide-react"

export default async function ProfileSettingsPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your public identity and profile URL.</p>
      </div>

      <div className="grid gap-8">
        <section className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold">Public Identity</h2>
              <p className="text-xs text-zinc-500">How you appear to others on your public profile.</p>
            </div>
          </div>
          
          <form action={updateProfile} className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                  Display Name
                </label>
                <input 
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={user?.name || ""}
                  placeholder="John Doe"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium text-zinc-300">
                  Profile Slug
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium select-none">
                     /u/
                   </div>
                   <input 
                    type="text"
                    id="slug"
                    name="slug"
                    defaultValue={user?.slug || ""}
                    placeholder="john-doe"
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                   This will be your public URL: <strong>vouchsite.es/u/{user?.slug || 'your-name'}</strong>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Shield size={14} className="text-emerald-500/50" />
                Slug must be unique
              </div>
              <button 
                type="submit"
                className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95"
              >
                Save Profile
              </button>
            </div>
          </form>
        </section>

        {user?.slug && (
           <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                 <LinkIcon size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-sm">Your profile is live!</h4>
                 <p className="text-xs text-zinc-400">Share your reputation with the world.</p>
               </div>
             </div>
             <a 
               href={`/u/${user.slug}`} 
               target="_blank"
               className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
             >
               View Profile
               <CheckCircle size={14} />
             </a>
           </div>
        )}
      </div>
    </div>
  )
}
