import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { User as UserIcon, ExternalLink } from "lucide-react"
import { SignOut } from "@/components/auth-components"
import { UserNav } from "@/components/dashboard/user-nav"
import { SidebarNav, MobileNav, Breadcrumbs } from "@/components/dashboard/dashboard-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"
import { BetaBanner } from "@/components/beta-banner"
import { prisma } from "@/lib/prisma"
import { hasActivePremium } from "@/lib/premium"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  const dbUser = session.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isPremium: true, premiumExpiresAt: true, bannedAt: true, slug: true },
      })
    : null

  // Enforce bans on already-issued JWT sessions: the proxy is JWT-only (can't
  // see ban state), so this DB-backed check is the real gate for logged-in users.
  if (dbUser?.bannedAt) {
    redirect("/banned")
  }

  const isPremium = hasActivePremium(dbUser)
  const isAdmin = session.user?.role === "ADMIN"

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#0c0c0e] lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-100 px-5 dark:border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-zinc-950 dark:text-white">
            <LogoMark size={28} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">Vouched.to</span>
          </Link>
        </div>

        <SidebarNav isAdmin={isAdmin} isPremium={isPremium} />

        <div className="space-y-2 border-t border-zinc-100 p-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">
              <UserIcon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                {session.user?.name || session.user?.username || "User"}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">{session.user?.email}</p>
            </div>
          </div>
          <SignOut />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#09090b]/90 md:px-8">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <Breadcrumbs />
            </div>

            <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
              <LogoMark size={28} className="rounded-lg" />
              <span className="text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-white">
                Vouched.to
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {dbUser?.slug && (
              <Link
                href={`/u/${dbUser.slug}`}
                target="_blank"
                className="btn-secondary mr-1 hidden !py-2 text-[13px] sm:inline-flex"
              >
                View profile
                <ExternalLink size={13} className="text-zinc-400" />
              </Link>
            )}
            <ThemeToggle />
            <UserNav user={session.user} />
          </div>
        </header>

        <BetaBanner />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile navigation: labelled bottom tab bar + slide-in drawer */}
      <MobileNav
        user={session.user ?? {}}
        isAdmin={isAdmin}
        isPremium={isPremium}
      />
    </div>
  )
}
