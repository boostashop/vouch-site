"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdminNavItem({
  href,
  icon,
  label,
  count,
}: {
  href: string,
  icon: React.ReactNode,
  label: string
  count?: number
}) {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
        active
          ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "text-white" : "text-zinc-500 group-hover:text-red-500 dark:group-hover:text-red-400"} transition-colors`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {count != null && count > 0 && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
          active ? "bg-white/20 text-white" : "bg-red-500/10 text-red-500"
        }`}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
