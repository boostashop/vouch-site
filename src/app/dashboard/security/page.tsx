import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ShieldCheck, Lock, Mail, Info } from "lucide-react"
import { TotpPanel } from "./TotpPanel"

export default async function SecurityPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { password: true, totpEnabled: true, email: true },
  })

  const hasPassword = !!user?.password

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage two-factor authentication and account security.</p>
      </div>

      {/* Sign-in methods */}
      <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white">Sign-in Method</h2>
            <p className="text-xs text-zinc-500">How you authenticate to your account.</p>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
            <Mail size={16} className="text-zinc-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Magic Link (Email)</p>
              <p className="text-xs text-zinc-500">{user?.email || "Connected"}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Active
            </span>
          </div>
          {hasPassword && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
              <Lock size={16} className="text-zinc-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Password</p>
                <p className="text-xs text-zinc-500">Username &amp; password login enabled</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 2FA */}
      <section className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white">Two-Factor Authentication</h2>
            <p className="text-xs text-zinc-500">Add a second layer of security with an authenticator app.</p>
          </div>
        </div>

        <div className="p-6">
          {!hasPassword ? (
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-400">
                2FA applies to password-based sign-in. Your account currently uses magic links, which are
                already a form of two-factor auth (email ownership + link possession). No additional setup needed.
              </p>
            </div>
          ) : (
            <TotpPanel totpEnabled={!!user?.totpEnabled} />
          )}
        </div>
      </section>
    </div>
  )
}
