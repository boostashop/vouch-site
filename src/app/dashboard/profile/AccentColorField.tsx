"use client"

import { useState } from "react"

// Keeps the color picker and the hex text box in sync, submitting a single
// value. Previously both inputs shared the name `profileAccentColor`, so the
// text field was dead (only the first input was read on submit).
export function AccentColorField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue || "#6366f1")
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value)

  return (
    <div className="space-y-1.5">
      <label htmlFor="profileAccentColor" className="field-label">
        Accent Color
      </label>
      <div className="flex gap-2.5">
        <input
          type="color"
          aria-label="Accent color picker"
          value={isValidHex ? value : "#6366f1"}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 transition-colors dark:border-white/10 dark:bg-black/40"
        />
        <input
          type="text"
          id="profileAccentColor"
          name="profileAccentColor"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#6366f1"
          className="input flex-1 font-mono"
        />
      </div>
      {!isValidHex && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Enter a 6-digit hex color like #6366f1.</p>
      )}
    </div>
  )
}
