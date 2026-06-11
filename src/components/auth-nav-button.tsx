"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

// The landing page is statically cached, so session state must be detected
// client-side. We show nothing while checking (avoids the "Sign In" flash
// for logged-in users) and redirect via proxy.ts for users with a session.
export function AuthNavButton() {
  const [state, setState] = useState<"loading" | "authed" | "guest">("loading")

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (active) setState(data?.user ? "authed" : "guest")
      })
      .catch(() => {
        if (active) setState("guest")
      })
    return () => {
      active = false
    }
  }, [])

  if (state === "loading") {
    return (
      <div className="w-24 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    )
  }

  return (
    <Link
      href={state === "authed" ? "/dashboard" : "/auth/signin"}
      className="bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-md"
    >
      {state === "authed" ? "Dashboard" : "Sign In"}
    </Link>
  )
}
