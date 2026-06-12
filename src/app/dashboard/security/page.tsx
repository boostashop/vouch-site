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
    <div className="max-w-2xl space-y-6 pb-16 animate-in fade-in duration-500">
      <div>
        <h1 className="page-title">Security</h1>
        <p className="page-subtitle">Manage two-factor authentication and account security.</p>
      </div>

      {/* Sign-in methods */}
      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="card-icon">
            <Lock size={15} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="card-title">Sign-in Method</h2>
            <p className="card-subtitle">How you authenticate to your account.</p>
          </div>
        </div>
        <div className="card-body space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <Mail size={15} className="shrink-0 text-zinc-400" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">Magic Link (Email)</p>
              <p className="text-xs text-zinc-500">{user?.email || "Connected"}</p>
            </div>
            <span className="chip-emerald">Active</span>
          </div>
          {hasPassword && (
            <div className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <Lock size={15} className="shrink-0 text-zinc-400" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">Password</p>
                <p className="text-xs text-zinc-500">Username &amp; password login enabled</p>
              </div>
              <span className="chip-emerald">Active</span>
            </div>
          )}
        </div>
      </section>

      {/* 2FA */}
      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="card-icon">
            <ShieldCheck size={15} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="card-title">Two-Factor Authentication</h2>
            <p className="card-subtitle">Add a second layer of security with an authenticator app.</p>
          </div>
        </div>

        <div className="card-body">
          {!hasPassword ? (
            <div className="flex items-start gap-3 rounded-lg border border-sky-500/20 bg-sky-500/[0.06] p-4">
              <Info size={15} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <p className="text-[13px] leading-relaxed text-sky-700 dark:text-sky-300">
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
