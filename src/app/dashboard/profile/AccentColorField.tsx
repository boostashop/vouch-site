"use client"

import { useState } from "react"

// Keeps the color picker and the hex text box in sync, submitting a single
// value. Previously both inputs shared the name `profileAccentColor`, so the
// text field was dead (only the first input was read on submit).
export function AccentColorField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue || "#6366f1")
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value)

  return (
    <div className="space-y-2">
      <label htmlFor="profileAccentColor" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Accent Color
      </label>
      <div className="flex gap-3">
        <input
          type="color"
          aria-label="Accent color picker"
          value={isValidHex ? value : "#6366f1"}
          onChange={(e) => setValue(e.target.value)}
          className="w-12 h-12 bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl p-1 cursor-pointer transition-all"
        />
        <input
          type="text"
          id="profileAccentColor"
          name="profileAccentColor"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#6366f1"
          className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>
      {!isValidHex && (
        <p className="text-[10px] text-amber-500">Enter a 6-digit hex color like #6366f1.</p>
      )}
    </div>
  )
}
