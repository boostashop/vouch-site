"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { SignOut } from "@/components/auth-components"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Match the href exactly (used for "/dashboard" so sub-routes don't light it up). */
  exact?: boolean
}

type NavGroup = {
  label: string | null
  items: NavItem[]
}

type NavUser = {
  name?: string | null
  username?: string | null
  email?: string | null
  image?: string | null
}

// The full set of destinations, shared by the desktop sidebar and the mobile
// drawer so the two never drift out of sync.
const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/vouches", label: "Vouches", icon: MessageSquare },
    ],
  },
  {
    label: "Configure",
    items: [
      { href: "/dashboard/bot", label: "Bot Settings", icon: Settings },
      { href: "/dashboard/profile", label: "Public Profile", icon: UserIcon },
      { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
    ],
  },
  {
    label: "Community",
    items: [{ href: "/leaderboard", label: "Leaderboard", icon: Trophy }],
  },
]

const ADMIN_GROUP: NavGroup = {
  label: "Staff",
  items: [{ href: "/admin", label: "Admin Panel", icon: ShieldAlert }],
}

// The handful of primary destinations that get a permanent slot in the mobile
// tab bar. Everything else lives one tap away behind the "Menu" tab.
const MOBILE_TABS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/vouches", label: "Vouches", icon: MessageSquare },
  { href: "/dashboard/bot", label: "Bot", icon: Settings },
  { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
]

// Pathname → breadcrumb leaf shown in the top bar. Longest prefix wins, so
// /dashboard/profile/builder resolves to "Design Studio".
const BREADCRUMB_LABELS: [string, string][] = [
  ["/dashboard/profile/builder", "Design Studio"],
  ["/dashboard/profile", "Public Profile"],
  ["/dashboard/vouches", "Vouches"],
  ["/dashboard/security", "Security"],
  ["/dashboard/bot", "Bot Settings"],
  ["/dashboard", "Overview"],
]

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + "/")
}

/** "Dashboard › <current page>" in the header, derived from the live route. */
export function Breadcrumbs() {
  const pathname = usePathname()
  const leaf = BREADCRUMB_LABELS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Overview"

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Link
        href="/dashboard"
        className="font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        Dashboard
      </Link>
      <ChevronRight size={13} className="text-zinc-300 dark:text-zinc-700" />
      <span className="font-medium text-zinc-900 dark:text-white">{leaf}</span>
    </div>
  )
}

function NavList({
  isAdmin,
  isPremium,
  pathname,
}: {
  isAdmin: boolean
  isPremium: boolean
  pathname: string
}) {
  const groups = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS

  return (
    <div className="space-y-5">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && (
            <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-zinc-100 text-zinc-900 dark:bg-white/[0.07] dark:text-white"
                      : "text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {!isPremium && (
        <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50 to-white p-3.5 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-transparent">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900 dark:text-white">
            <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
            Upgrade to Premium
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Unlimited vouches, badge embeds &amp; custom domain.
          </p>
          <Link
            href="/upgrade"
            className="mt-2.5 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            View plans
          </Link>
        </div>
      )}
    </div>
  )
}

/**
 * Desktop sidebar navigation list (the part that needs to know the current
 * route to highlight the active item). Rendered inside the server-side
 * <aside>; the logo / user card / sign-out around it stay server-rendered.
 */
export function SidebarNav({ isAdmin, isPremium }: { isAdmin: boolean; isPremium: boolean }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <NavList isAdmin={isAdmin} isPremium={isPremium} pathname={pathname} />
    </nav>
  )
}

/**
 * Mobile navigation: a labelled bottom tab bar with real active states, plus a
 * slide-in drawer (opened from the "Menu" tab) that holds every destination,
 * the user card and sign-out.
 */
export function MobileNav({
  user,
  isAdmin,
  isPremium,
}: {
  user: NavUser
  isAdmin: boolean
  isPremium: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the drawer whenever we navigate.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll + allow Escape to close while the drawer is open.
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
        <div className="flex h-[60px] items-stretch px-1">
          {MOBILE_TABS.map((item) => {
            const active = isActive(pathname, item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.2 : 2} />
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"
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
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                open ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Menu size={19} />
            </span>
            <span
              className={`text-[10px] font-medium ${
                open ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"
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
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col border-r border-zinc-200 bg-white shadow-2xl animate-in slide-in-from-left duration-200 dark:border-white/10 dark:bg-[#0c0c0e]">
            <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4 dark:border-white/[0.06]">
              <Link href="/dashboard" className="flex items-center gap-2.5 text-zinc-950 dark:text-white">
                <LogoMark size={28} className="rounded-lg" />
                <span className="text-[15px] font-semibold tracking-tight">Vouched.to</span>
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
              <NavList isAdmin={isAdmin} isPremium={isPremium} pathname={pathname} />
            </nav>

            <div className="space-y-2 border-t border-zinc-100 p-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    className="h-8 w-8 rounded-full border border-zinc-200 dark:border-white/10"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">
                    <UserIcon size={15} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                    {user.name || user.username || "User"}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">{user.email}</p>
                </div>
                <ThemeToggle />
              </div>
              <SignOut />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
