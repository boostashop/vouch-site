import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Ban } from "lucide-react"
import { LogoMark } from "@/components/logo"

// Notice shown to a suspended account. Reached when a banned user with a still-
// valid JWT session lands on a protected page (see dashboard/layout.tsx). Render
// fresh so an unban takes effect on the next visit.
export const dynamic = "force-dynamic"

export default async function BannedPage() {
  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { bannedAt: true, banReason: true },
      })
    : null

  // Not signed in, or not actually banned → nothing to see here.
  if (!user?.bannedAt) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center">
          <LogoMark size={48} className="rounded-xl shadow-xl shadow-indigo-600/20 mb-6" />
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
            <Ban size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Account suspended</h1>
          <p className="text-zinc-500 mt-3 font-medium leading-relaxed">
            Your account has been suspended and access is currently disabled.
          </p>
        </div>

        {user.banReason && (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Reason</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{user.banReason}</p>
          </div>
        )}

        <p className="text-sm text-zinc-500 font-medium">
          If you believe this is a mistake, contact support to appeal.
        </p>

        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
