import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ShieldAlert, LayoutDashboard, User as UserIcon } from "lucide-react"
import { SignOut } from "@/components/auth-components"
import { AdminSidebarNav, AdminMobileNav, AdminBreadcrumbs } from "@/components/admin/admin-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"
import { isAdmin } from "@/lib/admin"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  // Authoritative DB role check — the JWT role is stale after a grant/revoke.
  if (!(await isAdmin())) redirect("/dashboard")

  const flaggedCount = await prisma.vouch.count({ where: { status: "FLAGGED" } })

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#0c0c0e] lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-100 px-5 dark:border-white/[0.06]">
          <Link href="/admin" className="flex items-center gap-2.5 text-zinc-950 dark:text-white">
            <LogoMark size={28} tone="red" className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">Admin</span>
            <span className="ml-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400">
              Staff
            </span>
          </Link>
        </div>

        <AdminSidebarNav flaggedCount={flaggedCount} />

        <div className="space-y-1.5 border-t border-zinc-100 p-3 dark:border-white/[0.06]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg border border-indigo-500/20 px-3 py-2 text-[13px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/10 dark:text-indigo-400"
          >
            <LayoutDashboard size={15} />
            Exit to Dashboard
          </Link>
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400">
              <ShieldAlert size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                {session.user?.name || "Admin"}
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
              <AdminBreadcrumbs />
            </div>
            <Link href="/admin" className="flex items-center gap-2 md:hidden">
              <LogoMark size={28} tone="red" className="rounded-lg" />
              <span className="text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-white">Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-red-500/15 bg-red-500/5 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                Live
              </span>
            </div>
            <ThemeToggle />
            {session.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="Profile"
                className="h-7 w-7 rounded-full border border-zinc-200 dark:border-white/10"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400">
                <UserIcon size={13} />
              </span>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile navigation */}
      <AdminMobileNav user={session.user ?? {}} flaggedCount={flaggedCount} />
    </div>
  )
}
