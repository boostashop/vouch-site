"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Users,
  MessageSquare,
  Bell,
  ScrollText,
  ShieldAlert,
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  /** Key into the counts map for a badge (e.g. flagged queue). */
  badge?: "flagged"
}

type NavUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "System Pulse", icon: Activity, exact: true },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/vouches", label: "Vouch Audit", icon: MessageSquare },
  { href: "/admin/flagged", label: "Flagged Queue", icon: Bell, badge: "flagged" },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Core Settings", icon: ShieldAlert },
]

const MOBILE_TABS: NavItem[] = [
  { href: "/admin", label: "Pulse", icon: Activity, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/vouches", label: "Vouches", icon: MessageSquare },
  { href: "/admin/flagged", label: "Flagged", icon: Bell, badge: "flagged" },
]

const BREADCRUMB_LABELS: [string, string][] = [
  ["/admin/users", "User Management"],
  ["/admin/vouches", "Vouch Audit"],
  ["/admin/flagged", "Flagged Queue"],
  ["/admin/audit", "Audit Log"],
  ["/admin/settings", "Core Settings"],
  ["/admin", "System Pulse"],
]

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + "/")
}

export function AdminBreadcrumbs() {
  const pathname = usePathname()
  const leaf = BREADCRUMB_LABELS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "System Pulse"

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className="font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        Admin
      </Link>
      <ChevronRight size={13} className="text-zinc-300 dark:text-zinc-700" />
      <span className="font-medium text-zinc-900 dark:text-white">{leaf}</span>
    </div>
  )
}

function NavLinks({
  pathname,
  counts,
}: {
  pathname: string
  counts: { flagged: number }
}) {
  return (
    <div className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item)
        const Icon = item.icon
        const count = item.badge ? counts[item.badge] : 0
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-red-500/10 text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
            }`}
          >
            <Icon
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-colors ${
                active
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              }`}
            />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className="min-w-[18px] rounded-full bg-red-500/15 px-1.5 text-center text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-500/25 dark:text-red-400">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

/** Desktop sidebar nav list (client island inside the server-rendered aside). */
export function AdminSidebarNav({ flaggedCount }: { flaggedCount: number }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <NavLinks pathname={pathname} counts={{ flagged: flaggedCount }} />
    </nav>
  )
}

/** Mobile: labelled bottom tab bar + slide-in drawer (matches the user dashboard). */
export function AdminMobileNav({
  user,
  flaggedCount,
}: {
  user: NavUser
  flaggedCount: number
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0c0c0e]/95 lg:hidden">
        <div className="flex h-16 items-stretch">
          {MOBILE_TABS.map((item) => {
            const active = isActive(pathname, item)
            const Icon = item.icon
            const count = item.badge ? flaggedCount : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center justify-center gap-1"
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-red-500" />}
                <span className="relative">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.3 : 1.9}
                    className={active ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"}
                  />
                  {count > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="relative flex flex-1 flex-col items-center justify-center gap-1"
          >
            <Menu
              size={20}
              strokeWidth={1.9}
              className={open ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"}
            />
            <span
              className={`text-[10px] font-medium ${
                open ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          />

          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[82vw] flex-col border-l border-zinc-200 bg-white shadow-2xl animate-in slide-in-from-right duration-200 dark:border-white/10 dark:bg-[#0c0c0e]">
            <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4 dark:border-white/[0.06]">
              <Link href="/admin" className="flex items-center gap-2.5 text-zinc-950 dark:text-white">
                <LogoMark size={28} tone="red" className="rounded-lg" />
                <span className="text-[15px] font-semibold tracking-tight">Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="-mr-1 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks pathname={pathname} counts={{ flagged: flaggedCount }} />
              <Link
                href="/dashboard"
                className="mt-3 flex items-center gap-2.5 rounded-lg border border-indigo-500/20 px-3 py-2 text-[13px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/10 dark:text-indigo-400"
              >
                <LayoutDashboard size={16} />
                Exit to Dashboard
              </Link>
            </nav>

            <div className="space-y-2 border-t border-zinc-100 p-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400">
                  <ShieldAlert size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                    {user.name || "Admin"}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">{user.email}</p>
                </div>
                <ThemeToggle />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
