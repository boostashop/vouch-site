"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

export function FlashToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setVisible(true)
      const hide = setTimeout(() => setVisible(false), 3000)
      const clean = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("saved")
        router.replace(`/dashboard/bot?${params.toString()}`, { scroll: false })
      }, 3200)
      return () => { clearTimeout(hide); clearTimeout(clean) }
    }
  }, [searchParams, router])

  if (!visible) return null

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold">
        <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
        Settings saved
      </div>
    </div>
  )
}
