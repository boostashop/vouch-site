"use client"

import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"

const STORAGE_KEY = "beta-banner-dismissed-v1"

/**
 * Dismissible "public beta" announcement bar. Shared by the homepage and the
 * dashboard. Starts hidden and only reveals itself after mount once we've
 * confirmed (via localStorage) the user hasn't already dismissed it — that way
 * people who closed it never get a flash of it on the next page load.
 */
export function BetaBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true)
    } catch {
      // localStorage unavailable (private mode, etc.) — just show it.
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore — worst case the banner reappears next load
    }
    setVisible(false)
  }

  return (
    <div className="relative flex items-center justify-center gap-2 px-10 py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600">
      <Sparkles size={16} className="shrink-0" />
      <span>Public beta now released — thanks for being an early member of Vouched.to!</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/15 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
