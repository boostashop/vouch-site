"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

// The landing page is statically cached at the edge, so it can't know on the
// server whether you're logged in. We detect it in the browser instead: the
// cached HTML renders "Sign In", then if a session exists we swap to a
// "Dashboard" link. Keeps the page edge-cacheable while still giving signed-in
// visitors a one-click route to their dashboard.
export function AuthNavButton() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (active) setLoggedIn(Boolean(data?.user))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <Link
      href={loggedIn ? "/dashboard" : "/auth/signin"}
      className="bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-md"
    >
      {loggedIn ? "Dashboard" : "Sign In"}
    </Link>
  )
}
