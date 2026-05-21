"use client"

import { useState, useRef, useCallback, useTransition } from "react"
import { DesignTokens } from "@/types/design-tokens"
import { saveDesignTokens } from "@/app/dashboard/profile/actions"
import {
  Paintbrush, Monitor, Save, RefreshCw, CheckCircle2,
  RotateCcw, ArrowLeft, ExternalLink, Eye, SlidersHorizontal,
} from "lucide-react"
import Link from "next/link"

interface Props {
  slug: string
  initialTokens: DesignTokens
}

export function ProfileBuilder({ slug, initialTokens }: Props) {
  const [tokens, setTokens] = useState<DesignTokens>(initialTokens)
  const [isPending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle")
  const [hasChanges, setHasChanges] = useState(false)
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const baseRef = useRef<DesignTokens>(initialTokens)

  const updatePreview = useCallback(
    (t: DesignTokens) => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        try {
          const encoded = btoa(JSON.stringify(t))
          if (iframeRef.current) iframeRef.current.src = `/u/${slug}?t=${encoded}`
        } catch {}
      }, 550)
    },
    [slug]
  )

  const set = <K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) => {
    setTokens((prev) => {
      const next = { ...prev, [key]: value }
      setHasChanges(JSON.stringify(next) !== JSON.stringify(baseRef.current))
      updatePreview(next)
      return next
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      await saveDesignTokens(tokens, slug)
      baseRef.current = tokens
      setHasChanges(false)
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2500)
    })
  }

  const handleDiscard = () => {
    setTokens(baseRef.current)
    setHasChanges(false)
    updatePreview(baseRef.current)
  }

  const controls = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
        <Section title="Background">
          <ColorRow label="Page color" value={tokens.bgColor} onChange={(v) => set("bgColor", v)} />
          <Toggle label="Background glow" enabled={tokens.glowEnabled} onChange={(v) => set("glowEnabled", v)} />
          {tokens.glowEnabled && (
            <RangeRow
              label="Glow intensity"
              value={tokens.glowIntensity}
              min={3} max={30} unit="%"
              onChange={(v) => set("glowIntensity", v)}
            />
          )}
        </Section>

        <Section title="Cards">
          <ColorRow label="Background" value={tokens.cardBg} onChange={(v) => set("cardBg", v)} />
          <ColorRow label="Border" value={tokens.cardBorder} onChange={(v) => set("cardBorder", v)} />
          <RangeRow
            label="Corner radius"
            value={tokens.cardRadius}
            min={8} max={48} unit="px"
            leftLabel="Sharp" rightLabel="Pill"
            onChange={(v) => set("cardRadius", v)}
          />
        </Section>

        <Section title="Text">
          <ColorRow label="Main text" value={tokens.textPrimary} onChange={(v) => set("textPrimary", v)} />
          <ColorRow label="Subtle text" value={tokens.textSubtle} onChange={(v) => set("textSubtle", v)} />
        </Section>

        <Section title="Avatar Shape">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { label: "Square", r: 8, cls: "rounded-lg" },
                { label: "Rounded", r: 24, cls: "rounded-2xl" },
                { label: "Circle", r: 9999, cls: "rounded-full" },
              ] as const
            ).map(({ label, r, cls }) => (
              <button
                key={label}
                type="button"
                onClick={() => set("avatarRadius", r)}
                className={`flex flex-col items-center gap-2 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                  tokens.avatarRadius === r
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                    : "border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20"
                }`}
              >
                <div className={`w-8 h-8 ${cls} bg-zinc-200 dark:bg-zinc-700`} />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Spacing">
          <div className="grid grid-cols-3 gap-2">
            {(["compact", "normal", "spacious"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("spacing", s)}
                className={`py-2 rounded-xl border text-[10px] font-bold capitalize transition-all ${
                  tokens.spacing === s
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                    : "border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Save footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/5 space-y-2">
        {hasChanges && (
          <button
            type="button"
            onClick={handleDiscard}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <RotateCcw size={11} />
            Discard changes
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || saveState === "saved"}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold transition-all disabled:opacity-60 ${
            saveState === "saved"
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          }`}
        >
          {saveState === "saved" ? (
            <><CheckCircle2 size={15} /> Published!</>
          ) : isPending ? (
            <><RefreshCw size={15} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={15} /> Save & Publish</>
          )}
        </button>
      </div>
    </div>
  )

  const previewPanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden min-h-0">
        {/* Browser chrome */}
        <div className="h-9 flex items-center gap-2 px-3 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
          <div className="flex-1 mx-2 bg-zinc-200 dark:bg-zinc-800 rounded h-5 flex items-center px-2.5">
            <span className="text-[10px] text-zinc-500 font-mono truncate">vouched.to/u/{slug}</span>
          </div>
          <a
            href={`/u/${slug}`}
            target="_blank"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
        <iframe
          ref={iframeRef}
          src={`/u/${slug}`}
          className="flex-1 w-full"
          title="Profile Preview"
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 8rem)" }}>
      {/* Shared header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Paintbrush size={15} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">Design Studio</h1>
            <p className="text-[11px] text-zinc-500 hidden sm:block">Changes auto-preview below</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile tab switcher */}
          <div className="flex lg:hidden bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === "edit"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              <SlidersHorizontal size={12} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === "preview"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              <Eye size={12} />
              Preview
            </button>
          </div>

          <a
            href={`/u/${slug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Monitor size={13} />
            Open live
          </a>
        </div>
      </div>

      {/* Desktop: split panel */}
      <div
        className="hidden lg:flex gap-5 flex-1 min-h-0"
        style={{ height: "calc(100vh - 11rem)" }}
      >
        <div className="w-72 shrink-0 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col">
          {controls}
        </div>
        <div className="flex-1 min-w-0">
          {previewPanel}
        </div>
      </div>

      {/* Mobile: single tab */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0">
        {mobileTab === "edit" ? (
          <div className="flex-1 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 12rem)" }}>
            {controls}
          </div>
        ) : (
          <div className="flex-1 flex flex-col" style={{ height: "calc(100vh - 12rem)" }}>
            {previewPanel}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em]">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative cursor-pointer shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
        <div
          className="w-9 h-9 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-white/10 transition-transform active:scale-95"
          style={{ backgroundColor: value }}
        />
      </label>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</div>
        <div className="text-[10px] font-mono text-zinc-400">{value.toUpperCase()}</div>
      </div>
    </div>
  )
}

function Toggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          enabled ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
            enabled ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  )
}

function RangeRow({
  label, value, min, max, unit, leftLabel, rightLabel, onChange,
}: {
  label: string; value: number; min: number; max: number
  unit: string; leftLabel?: string; rightLabel?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="text-xs font-black font-mono text-zinc-900 dark:text-white tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none bg-zinc-200 dark:bg-zinc-700 accent-indigo-500 cursor-pointer"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[9px] text-zinc-400">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}
