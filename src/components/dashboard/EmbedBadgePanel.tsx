"use client"

import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"

type Size = "banner" | "chip"
type Format = "bbcode" | "html" | "markdown"

const SIZES: { id: Size; label: string }[] = [
  { id: "banner", label: "Signature banner" },
  { id: "chip", label: "Compact chip" },
]

const FORMATS: { id: Format; label: string }[] = [
  { id: "bbcode", label: "BBCode" },
  { id: "html", label: "HTML" },
  { id: "markdown", label: "Markdown" },
]

export function EmbedBadgePanel({
  baseUrl,
  slug,
  name,
}: {
  baseUrl: string
  slug: string
  name: string
}) {
  const [size, setSize] = useState<Size>("banner")
  const [format, setFormat] = useState<Format>("bbcode")
  const [copied, setCopied] = useState(false)

  const profileUrl = `${baseUrl}/u/${slug}`
  const imgUrl = `${baseUrl}/u/${slug}/badge${size === "chip" ? "?size=chip" : ""}`
  const altText = `${name} — verified vouches on Vouched.to`

  const snippet = useMemo(() => {
    switch (format) {
      case "bbcode":
        return `[url=${profileUrl}][img]${imgUrl}[/img][/url]`
      case "html":
        return `<a href="${profileUrl}" target="_blank" rel="noopener"><img src="${imgUrl}" alt="${altText}" /></a>`
      case "markdown":
        return `[![${altText}](${imgUrl})](${profileUrl})`
    }
  }, [format, profileUrl, imgUrl, altText])

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard can be blocked (insecure context / permissions) — no-op.
    }
  }

  return (
    <div className="space-y-6">
      {/* Live preview */}
      <div className="flex items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/40 p-6 overflow-x-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={imgUrl}
          src={imgUrl}
          alt="Badge preview"
          className="max-w-none"
          style={size === "chip" ? { width: 285, height: 50 } : { width: 280, height: 70 }}
        />
      </div>

      {/* Size toggle */}
      <div className="flex flex-wrap gap-2">
        {SIZES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSize(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              size === s.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-zinc-100 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Format tabs */}
      <div className="space-y-3">
        <div className="flex gap-1 border-b border-zinc-200 dark:border-white/10">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 -mb-px ${
                format === f.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="bg-zinc-950 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl p-4 pr-14 text-xs text-zinc-100 overflow-x-auto font-mono whitespace-pre-wrap break-all">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy snippet"
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[10px] text-zinc-500">
          The image updates automatically as you collect new vouches. Paste it into a forum
          signature, marketplace listing, or anywhere that allows images.
        </p>
      </div>
    </div>
  )
}
