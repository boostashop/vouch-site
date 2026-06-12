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

type NavUser = {
  name?: string | null
  username?: string | null
  email?: string | null
  image?: string | null
}

// The full set of destinations, shared by the desktop sidebar and the mobile
// drawer so the two never drift out of sync.
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/bot", label: "Bot Settings", icon: Settings },
  { href: "/dashboard/vouches", label: "Vouches", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Public Profile", icon: UserIcon },
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
]

const ADMIN_ITEM: NavItem = { href: "/admin", label: "Admin Panel", icon: ShieldAlert }

// The handful of primary destinations that get a permanent slot in the mobile
// tab bar. Everything else lives one tap away behind the "Menu" tab.
const MOBILE_TABS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/vouches", label: "Vouches", icon: MessageSquare },
  { href: "/dashboard/bot", label: "Bot", icon: Settings },
  { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
]

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + "/")
}

/**
 * Desktop sidebar navigation list (the part that needs to know the current
 * route to highlight the active item). Rendered inside the server-side
 * <aside>; the logo / user card / sign-out around it stay server-rendered.
 */
export function SidebarNav({ isAdmin, isPremium }: { isAdmin: boolean; isPremium: boolean }) {
  const pathname = usePathname()
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <nav className="flex-1 px-4 py-4 space-y-1 text-zinc-950 dark:text-white">
      {items.map((item) => {
        const active = isActive(pathname, item)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
              active
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
            }`}
          >
            <span className={`${active ? "text-white" : "text-zinc-600 group-hover:text-indigo-400"} transition-colors`}>
              <Icon size={18} />
            </span>
            {item.label}
          </Link>
        )
      })}
      {!isPremium && (
        <Link
          href="/upgrade"
          className="flex items-center gap-3 px-4 py-3 mt-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 hover:opacity-95 active:scale-[0.98] transition-all"
        >
          <Sparkles size={18} />
          Go Premium
        </Link>
      )}
    </nav>
  )
}

/**
 * Mobile navigation: a labelled bottom tab bar with real active states, plus a
 * slide-in drawer (opened from the "Menu" tab) that holds every destination,
 * the user card and sign-out. Replaces the old icon-only bar and the dead
 * header hamburger.
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

  const drawerItems = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-zinc-200 dark:border-white/5 flex items-stretch px-1 pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
        {MOBILE_TABS.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-1"
            >
              {active && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-indigo-600" />}
              <Icon
                size={20}
                className={active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}
              />
              <span
                className={`text-[10px] font-semibold tracking-tight ${
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
          className="relative flex flex-1 flex-col items-center justify-center gap-1"
        >
          <Menu
            size={20}
            className={open ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}
          />
          <span
            className={`text-[10px] font-semibold tracking-tight ${
              open ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Menu
          </span>
        </button>
      </nav>

      {/* Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-72 max-w-[82vw] bg-white dark:bg-[#050505] border-r border-zinc-200 dark:border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/10">
              <Link href="/dashboard" className="flex items-center gap-2.5 text-zinc-950 dark:text-white">
                <LogoMark size={30} className="rounded-lg shadow-lg shadow-indigo-600/20" />
                <span className="text-lg font-bold tracking-tight">Vouched.to</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {drawerItems.map((item) => {
                const active = isActive(pathname, item)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                      active
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className={`${active ? "text-white" : "text-zinc-600 group-hover:text-indigo-400"} transition-colors`}>
                      <Icon size={18} />
                    </span>
                    {item.label}
                  </Link>
                )
              })}
              {!isPremium && (
                <Link
                  href="/upgrade"
                  className="flex items-center gap-3 px-4 py-3 mt-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 hover:opacity-95 active:scale-[0.98] transition-all"
                >
                  <Sparkles size={18} />
                  Go Premium
                </Link>
              )}
            </nav>

            <div className="p-4 border-t border-zinc-200 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="w-9 h-9 rounded-xl border border-black/5 dark:border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UserIcon size={18} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {user.name || user.username || "User"}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-medium uppercase tracking-wider">
                    {user.email}
                  </p>
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
