"use client"

import { useState, useRef, useEffect } from "react"
import { User, Settings, LogOut, ChevronDown } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

export function UserNav({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors group"
      >
        {user?.image ? (
          <img 
            src={user.image} 
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-white/10 shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
            <User size={14} />
          </div>
        )}
        <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-white/5 mb-2">
            <p className="text-sm font-bold text-white truncate">{user?.name || user?.username || 'User'}</p>
            <p className="text-[10px] text-zinc-500 truncate uppercase tracking-wider mt-0.5">{user?.email}</p>
          </div>
          
          <div className="px-2 space-y-1">
            <Link 
              href="/dashboard/profile" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <User size={16} />
              Public Profile
            </Link>
            <Link 
              href="/dashboard/bot" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings size={16} />
              Bot Settings
            </Link>
          </div>
          
          <div className="mt-2 pt-2 border-t border-white/5 px-2">
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
