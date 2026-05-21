import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateProfile } from "./actions"
import { User, Link as LinkIcon, Shield, CheckCircle, Palette, Globe, Search } from "lucide-react"

export default async function ProfileSettingsPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage your public identity, themes, and professional appearance.</p>
      </div>

      <form action={updateProfile} className="space-y-8">
        {/* Public Identity */}
        <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-white">Public Identity</h2>
              <p className="text-xs text-zinc-500">How you appear to others on your public profile.</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Display Name
                </label>
                <input 
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={user?.name || ""}
                  placeholder="John Doe"
                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                   This will be your public URL: <strong>vouched.to/u/{user?.slug || 'your-name'}</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Customization */}
        <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-white">Profile Customization</h2>
              <p className="text-xs text-zinc-500">Express yourself with themes and colors.</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="profileTheme" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Theme
                </label>
                <select 
                  id="profileTheme"
                  name="profileTheme"
                  defaultValue={user?.profileTheme || "dark"}
                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                >
                  <option value="dark">Midnight (Dark)</option>
                  <option value="light">Daylight (Light)</option>
                  <option value="glass">Glassmorphism - Premium</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="profileAccentColor" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Accent Color
                </label>
                <div className="flex gap-3">
                  <input 
                    type="color"
                    id="profileAccentColor"
                    name="profileAccentColor"
                    defaultValue={user?.profileAccentColor || "#6366f1"}
                    className="w-12 h-12 bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl p-1 cursor-pointer transition-all"
                  />
                  <input 
                    type="text"
                    id="accent_color_text"
                    name="profileAccentColor"
                    defaultValue={user?.profileAccentColor || "#6366f1"}
                    placeholder="#6366f1"
                    className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO & Domain */}
        <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-white">SEO & Domain</h2>
              <p className="text-xs text-zinc-500">Control how search engines and custom domains see you.</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="profileMetaTitle" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Meta Title
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="text"
                    id="profileMetaTitle"
                    name="profileMetaTitle"
                    defaultValue={user?.profileMetaTitle || ""}
                    placeholder="My Professional Vouch Profile"
                    className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="profileMetaDescription" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Meta Description
                </label>
                <textarea 
                  id="profileMetaDescription"
                  name="profileMetaDescription"
                  defaultValue={user?.profileMetaDescription || ""}
                  placeholder="Check out my verified vouches and testimonials..."
                  rows={3}
                  className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                />
              </div>

              <div className="space-y-2 pt-4">
                <label htmlFor="customDomain" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  Custom Domain
                  {!user?.isPremium && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Premium</span>}
                </label>
                <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                   <input 
                    type="text"
                    id="customDomain"
                    name="customDomain"
                    defaultValue={user?.customDomain || ""}
                    disabled={!user?.isPremium}
                    placeholder="vouch.yourname.com"
                    className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                   Map your own domain to your profile. (CNAME record to <strong>cname.vouched.to</strong>)
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Shield size={14} className="text-emerald-500/50" />
              Settings are saved immediately to your profile
            </div>
            <button 
              type="submit"
              className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl text-sm font-extrabold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5"
            >
              Save All Changes
            </button>
          </div>
        </section>
      </form>

      {user?.slug && (
         <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-inner">
               <LinkIcon size={24} />
             </div>
             <div>
               <h4 className="font-bold text-lg text-zinc-900 dark:text-white">Your profile is live!</h4>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Share your reputation with the world.</p>
             </div>
           </div>
           <a 
             href={`/u/${user.slug}`} 
             target="_blank"
             className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
           >
             View Public Profile
             <CheckCircle size={18} />
           </a>
         </div>
      )}
    </div>
  )
}

