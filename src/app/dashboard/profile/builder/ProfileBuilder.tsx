"use client"

import { useState, useRef, useCallback, useTransition, useEffect } from "react"
import {
  ProfileDesignConfig,
  configToCSS,
  defaultDarkConfig,
  defaultLightConfig,
} from "@/types/design-tokens"
import { saveDesignTokens } from "@/app/dashboard/profile/actions"
import {
  Paintbrush, Monitor, Save, RefreshCw, CheckCircle2,
  RotateCcw, ArrowLeft, ExternalLink, Eye, SlidersHorizontal,
  ChevronDown, Palette, Type, Image, Square, Star, BarChart2,
  Tag, MousePointer, Settings,
} from "lucide-react"
import Link from "next/link"

type DesignTokens = ProfileDesignConfig

interface Props {
  slug: string
  initialTokens: DesignTokens
}

type SectionId =
  | "page" | "glow" | "typography" | "name"
  | "avatar" | "cards" | "rating" | "stats" | "button" | "advanced"

export function ProfileBuilder({ slug, initialTokens }: Props) {
  const [tokens, setTokens] = useState<DesignTokens>(initialTokens)
  const [isPending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle")
  const [hasChanges, setHasChanges] = useState(false)
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit")
  const [previewKey, setPreviewKey] = useState(0)
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    new Set(["page", "cards"])
  )
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const baseRef = useRef<DesignTokens>(initialTokens)
  const tokensRef = useRef<DesignTokens>(initialTokens)

  const sendCSS = useCallback((t: DesignTokens) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "vc-preview-css", css: configToCSS(t) },
        "*"
      )
    } catch {}
  }, [])

  const set = <K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) => {
    setTokens((prev) => {
      const next = { ...prev, [key]: value }
      tokensRef.current = next
      setHasChanges(JSON.stringify(next) !== JSON.stringify(baseRef.current))
      sendCSS(next)
      return next
    })
  }

  const handleIframeLoad = useCallback(() => {
    sendCSS(tokensRef.current)
  }, [sendCSS])

  useEffect(() => {
    if (mobileTab === "preview") {
      setPreviewKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileTab])

  const toggleSection = (id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
    const t = baseRef.current
    setTokens(t)
    tokensRef.current = t
    setHasChanges(false)
    sendCSS(t)
  }

  const handleReset = (mode: "dark" | "light") => {
    const t = mode === "dark" ? defaultDarkConfig : defaultLightConfig
    setTokens(t)
    tokensRef.current = t
    setHasChanges(JSON.stringify(t) !== JSON.stringify(baseRef.current))
    sendCSS(t)
  }

  const section = (
    id: SectionId,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode
  ) => {
    const open = openSections.has(id)
    return (
      <div key={id} className="border-b border-zinc-100 dark:border-white/5 last:border-0">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-indigo-400">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300">
              {title}
            </span>
          </div>
          <ChevronDown
            size={13}
            className={`text-zinc-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && <div className="px-4 pb-4 space-y-3">{content}</div>}
      </div>
    )
  }

  const controls = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0">

        {section("page", "Page", <Palette size={12} />, (
          <>
            <Segmented
              label="Background type"
              value={tokens.pageBgType}
              options={[
                { label: "Solid", value: "solid" },
                { label: "Gradient", value: "gradient" },
              ]}
              onChange={(v) => set("pageBgType", v as "solid" | "gradient")}
            />
            <ColorRow
              label={tokens.pageBgType === "gradient" ? "From color" : "Color"}
              value={tokens.pageBg}
              onChange={(v) => set("pageBg", v)}
            />
            {tokens.pageBgType === "gradient" && (
              <>
                <ColorRow
                  label="To color"
                  value={tokens.pageBgGradientTo}
                  onChange={(v) => set("pageBgGradientTo", v)}
                />
                <RangeRow
                  label="Angle"
                  value={tokens.pageBgGradientAngle}
                  min={0} max={360} unit="°"
                  onChange={(v) => set("pageBgGradientAngle", v)}
                />
              </>
            )}
          </>
        ))}

        {section("glow", "Glow", <Star size={12} />, (
          <>
            <Toggle
              label="Background glow"
              enabled={tokens.glowEnabled}
              onChange={(v) => set("glowEnabled", v)}
            />
            {tokens.glowEnabled && (
              <RangeRow
                label="Intensity"
                value={tokens.glowIntensity}
                min={3} max={30} unit="%"
                onChange={(v) => set("glowIntensity", v)}
              />
            )}
          </>
        ))}

        {section("typography", "Typography", <Type size={12} />, (
          <Segmented
            label="Font family"
            value={tokens.fontFamily}
            options={[
              { label: "Sans", value: "sans" },
              { label: "Serif", value: "serif" },
              { label: "Mono", value: "mono" },
            ]}
            onChange={(v) => set("fontFamily", v as "sans" | "serif" | "mono")}
          />
        ))}

        {section("name", "Name & Header", <Type size={12} />, (
          <>
            <ColorRow label="Name color" value={tokens.nameColor} onChange={(v) => set("nameColor", v)} />
            <RangeRow
              label="Font size"
              value={tokens.nameFontSize}
              min={28} max={72} unit="px"
              onChange={(v) => set("nameFontSize", v)}
            />
            <RangeRow
              label="Font weight"
              value={tokens.nameWeight}
              min={400} max={900} step={100} unit=""
              onChange={(v) => set("nameWeight", v)}
            />
            <RangeRow
              label="Letter spacing"
              value={tokens.nameLetterSpacing}
              min={-5} max={10} unit="/100em"
              leftLabel="Tight" rightLabel="Wide"
              onChange={(v) => set("nameLetterSpacing", v)}
            />
            <ColorRow label="Subtitle color" value={tokens.subtleColor} onChange={(v) => set("subtleColor", v)} />
          </>
        ))}

        {section("avatar", "Avatar", <Image size={12} />, (
          <>
            <div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-2">Shape</p>
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
                    <div className={`w-7 h-7 ${cls} bg-zinc-200 dark:bg-zinc-700`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ColorRow label="Border color" value={tokens.avatarBorderColor} onChange={(v) => set("avatarBorderColor", v)} />
            <RangeRow
              label="Border width"
              value={tokens.avatarBorderWidth}
              min={1} max={4} unit="px"
              onChange={(v) => set("avatarBorderWidth", v)}
            />
            <Toggle label="Drop shadow" enabled={tokens.avatarShadow} onChange={(v) => set("avatarShadow", v)} />
          </>
        ))}

        {section("cards", "Vouch Cards", <Square size={12} />, (
          <>
            <ColorRow label="Background" value={tokens.cardBg} onChange={(v) => set("cardBg", v)} />
            <ColorRow label="Border color" value={tokens.cardBorderColor} onChange={(v) => set("cardBorderColor", v)} />
            <RangeRow
              label="Border width"
              value={tokens.cardBorderWidth}
              min={1} max={3} unit="px"
              onChange={(v) => set("cardBorderWidth", v)}
            />
            <RangeRow
              label="Corner radius"
              value={tokens.cardRadius}
              min={0} max={48} unit="px"
              leftLabel="Sharp" rightLabel="Pill"
              onChange={(v) => set("cardRadius", v)}
            />
            <Segmented
              label="Shadow"
              value={tokens.cardShadow}
              options={[
                { label: "None", value: "none" },
                { label: "SM", value: "sm" },
                { label: "MD", value: "md" },
                { label: "LG", value: "lg" },
              ]}
              onChange={(v) => set("cardShadow", v as "none" | "sm" | "md" | "lg")}
            />
            <RangeRow
              label="Padding"
              value={tokens.cardPadding}
              min={0.75} max={3} step={0.25} unit="rem"
              onChange={(v) => set("cardPadding", v)}
            />
            <ColorRow label="Comment color" value={tokens.cardCommentColor} onChange={(v) => set("cardCommentColor", v)} />
            <RangeRow
              label="Comment size"
              value={tokens.cardCommentSize}
              min={12} max={18} unit="px"
              onChange={(v) => set("cardCommentSize", v)}
            />
          </>
        ))}

        {section("rating", "Rating Badge", <Star size={12} />, (
          <>
            <ColorRow label="Background" value={tokens.ratingBg} onChange={(v) => set("ratingBg", v)} />
            <ColorRow label="Text color" value={tokens.ratingColor} onChange={(v) => set("ratingColor", v)} />
            <ColorRow label="Border color" value={tokens.ratingBorderColor} onChange={(v) => set("ratingBorderColor", v)} />
            <RangeRow
              label="Corner radius"
              value={tokens.ratingRadius}
              min={0} max={24} unit="px"
              onChange={(v) => set("ratingRadius", v)}
            />
          </>
        ))}

        {section("stats", "Stats & Badges", <BarChart2 size={12} />, (
          <>
            <SubLabel>Stat Cards</SubLabel>
            <ColorRow label="Background" value={tokens.statBg} onChange={(v) => set("statBg", v)} />
            <ColorRow label="Border color" value={tokens.statBorderColor} onChange={(v) => set("statBorderColor", v)} />
            <RangeRow
              label="Corner radius"
              value={tokens.statRadius}
              min={0} max={32} unit="px"
              onChange={(v) => set("statRadius", v)}
            />
            <ColorRow label="Label color" value={tokens.statLabelColor} onChange={(v) => set("statLabelColor", v)} />
            <ColorRow label="Value color" value={tokens.statValueColor} onChange={(v) => set("statValueColor", v)} />

            <div className="border-t border-zinc-100 dark:border-white/5 pt-3 mt-1">
              <SubLabel>Badge Chips</SubLabel>
              <div className="space-y-3 mt-3">
                <ColorRow label="Background" value={tokens.badgeBg} onChange={(v) => set("badgeBg", v)} />
                <ColorRow label="Border color" value={tokens.badgeBorderColor} onChange={(v) => set("badgeBorderColor", v)} />
                <ColorRow label="Text color" value={tokens.badgeTextColor} onChange={(v) => set("badgeTextColor", v)} />
                <RangeRow
                  label="Corner radius"
                  value={tokens.badgeRadius}
                  min={0} max={24} unit="px"
                  onChange={(v) => set("badgeRadius", v)}
                />
              </div>
            </div>
          </>
        ))}

        {section("button", "CTA Button", <MousePointer size={12} />, (
          <>
            <ColorRow label="Background" value={tokens.ctaBg} onChange={(v) => set("ctaBg", v)} />
            <ColorRow label="Text color" value={tokens.ctaTextColor} onChange={(v) => set("ctaTextColor", v)} />
            <RangeRow
              label="Corner radius"
              value={tokens.ctaRadius}
              min={0} max={32} unit="px"
              onChange={(v) => set("ctaRadius", v)}
            />
          </>
        ))}

        {section("advanced", "Advanced", <Settings size={12} />, (
          <>
            <ColorRow label="Divider color" value={tokens.dividerColor} onChange={(v) => set("dividerColor", v)} />

            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Custom CSS</p>
              <p className="text-[10px] text-zinc-400 leading-snug">
                Appended after generated rules. Target <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">#vp .vc-*</code> selectors.
              </p>
              <textarea
                value={tokens.customCSS}
                onChange={(e) => set("customCSS", e.target.value)}
                placeholder={"#vp .vc-name {\n  text-transform: uppercase;\n}"}
                rows={6}
                spellCheck={false}
                className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleReset("dark")}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wide text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/20 transition-all"
              >
                Reset Dark
              </button>
              <button
                type="button"
                onClick={() => handleReset("light")}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wide text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/20 transition-all"
              >
                Reset Light
              </button>
            </div>
          </>
        ))}
      </div>

      {/* Save footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/5 space-y-2 shrink-0">
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
            <><RefreshCw size={15} className="animate-spin" /> Saving…</>
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
          key={previewKey}
          ref={iframeRef}
          src={`/u/${slug}`}
          onLoad={handleIframeLoad}
          className="flex-1 w-full"
          title="Profile Preview"
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 8rem)" }}>
      {/* Header */}
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
            <p className="text-[11px] text-zinc-500 hidden sm:block">Live preview — changes appear instantly</p>
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
      <div className="hidden lg:flex gap-5 flex-1 min-h-0" style={{ height: "calc(100vh - 11rem)" }}>
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
          <div
            className="flex-1 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100vh - 12rem)" }}
          >
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

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em]">
      {children}
    </p>
  )
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value)
  return (
    <div className="flex items-center gap-3">
      <label className="relative cursor-pointer shrink-0">
        <input
          type="color"
          value={isHex ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
        <div
          className="w-9 h-9 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-white/10 transition-transform active:scale-95"
          style={{ backgroundColor: value }}
        />
      </label>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>
    </div>
  )
}

function Toggle({
  label,
  enabled,
  onChange,
}: {
  label: string
  enabled: boolean
  onChange: (v: boolean) => void
}) {
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
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  leftLabel,
  rightLabel,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  leftLabel?: string
  rightLabel?: string
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
        min={min}
        max={max}
        step={step}
        value={value}
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

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">{label}</p>
      <div className="flex rounded-xl border border-zinc-200 dark:border-white/10 overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 text-[11px] font-bold transition-colors ${
              value === opt.value
                ? "bg-indigo-500/10 text-indigo-500"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
