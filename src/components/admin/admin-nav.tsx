"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdminNavItem({ 
  href, 
  icon, 
  label 
}: { 
  href: string, 
  icon: React.ReactNode, 
  label: string 
}) {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
        active 
          ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
          : "text-zinc-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className={`${active ? "text-white" : "text-zinc-600 group-hover:text-red-400"} transition-colors`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}
