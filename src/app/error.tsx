"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCw, Home } from "lucide-react"
import { LogoMark } from "@/components/logo"

// Global error boundary — without this, any thrown server action or render
// error shows Next's bare "Application error" screen.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 font-sans text-center">
      <LogoMark size={48} className="rounded-xl shadow-xl shadow-indigo-600/20 mb-8" />
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="text-zinc-500 mt-3 max-w-sm leading-relaxed">
        An unexpected error occurred. It&apos;s been logged — trying again usually fixes it.
      </p>
      {error.digest && (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono mt-2">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
        >
          <RotateCw size={16} /> Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 border border-zinc-200 dark:border-white/10"
        >
          <Home size={16} /> Go home
        </Link>
      </div>
    </div>
  )
}
