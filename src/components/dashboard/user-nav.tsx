"use client"

import { useState, useRef, useEffect } from "react"
import { User, Settings, LogOut, ChevronDown, ShieldCheck } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

type NavUser = {
  name?: string | null
  username?: string | null
  email?: string | null
  image?: string | null
}

const MENU_LINKS = [
  { href: "/dashboard/profile", label: "Public Profile", icon: User },
  { href: "/dashboard/bot", label: "Bot Settings", icon: Settings },
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
]

export function UserNav({ user }: { user: NavUser | undefined }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="group flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt="Profile"
            className="h-7 w-7 rounded-full border border-zinc-200 dark:border-white/10"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">
            <User size={13} />
          </span>
        )}
        <ChevronDown
          size={13}
          className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl shadow-black/5 animate-in fade-in zoom-in-95 duration-100 dark:border-white/10 dark:bg-[#141416] dark:shadow-black/40">
          <div className="border-b border-zinc-100 px-3.5 pb-2.5 pt-2 dark:border-white/[0.06]">
            <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
              {user?.name || user?.username || "User"}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{user?.email}</p>
          </div>

          <div className="px-1.5 pt-1.5">
            {MENU_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <Icon size={15} className="text-zinc-400 dark:text-zinc-500" />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-1.5 border-t border-zinc-100 px-1.5 pt-1.5 dark:border-white/[0.06]">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
