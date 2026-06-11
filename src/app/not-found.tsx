import Link from "next/link"
import { Home } from "lucide-react"
import { LogoMark } from "@/components/logo"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 font-sans text-center">
      <LogoMark size={48} className="rounded-xl shadow-xl shadow-indigo-600/20 mb-8" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 mb-3">404</p>
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
        Page not found
      </h1>
      <p className="text-zinc-500 mt-3 max-w-sm leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
      >
        <Home size={16} /> Back home
      </Link>
    </div>
  )
}
