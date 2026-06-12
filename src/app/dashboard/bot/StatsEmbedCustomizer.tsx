"use client"

import { useState } from "react"
import { Palette, Lock } from "lucide-react"
import { updateStatsSettings } from "./actions"
import { EmbedPreview } from "./EmbedPreview"
import Link from "next/link"

interface StatsEmbedCustomizerProps {
  statsEmbedTitle: string
  statsEmbedDescription: string
  statsEmbedFooter: string
  statsEmbedColor: string
  statsEmbedAuthorName: string | null
  statsEmbedAuthorIconUrl: string | null
  statsEmbedThumbnailUrl: string | null
  statsEmbedFooterIconUrl: string | null
  statsShowCount: boolean
  statsShowScore: boolean
  statsShowLeaderboard: boolean
  statsShowPlan: boolean
  statsShowExpiration: boolean
  statsShowAge: boolean
  isPremium: boolean
}

export function StatsEmbedCustomizer({
  statsEmbedTitle,
  statsEmbedDescription,
  statsEmbedFooter,
  statsEmbedColor,
  statsEmbedAuthorName,
  statsEmbedAuthorIconUrl,
  statsEmbedThumbnailUrl,
  statsEmbedFooterIconUrl,
  statsShowCount,
  statsShowScore,
  statsShowLeaderboard,
  statsShowPlan,
  statsShowExpiration,
  statsShowAge,
  isPremium,
}: StatsEmbedCustomizerProps) {
  const [title, setTitle] = useState(statsEmbedTitle)
  const [description, setDescription] = useState(statsEmbedDescription)
  const [footer, setFooter] = useState(statsEmbedFooter)
  const [color, setColor] = useState(statsEmbedColor)
  const [authorName, setAuthorName] = useState(statsEmbedAuthorName || "")
  const [authorIconUrl, setAuthorIconUrl] = useState(statsEmbedAuthorIconUrl || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(statsEmbedThumbnailUrl || "")
  const [footerIconUrl, setFooterIconUrl] = useState(statsEmbedFooterIconUrl || "")
  const [showCount, setShowCount] = useState(statsShowCount)
  const [showScore, setShowScore] = useState(statsShowScore)
  const [showLeaderboard, setShowLeaderboard] = useState(statsShowLeaderboard)
  const [showPlan, setShowPlan] = useState(statsShowPlan)
  const [showExpiration, setShowExpiration] = useState(statsShowExpiration)
  const [showAge, setShowAge] = useState(statsShowAge)

  if (!isPremium) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock size={24} className="text-amber-500" />
        </div>
        <div className="space-y-1.5">
          <p className="font-bold text-zinc-900 dark:text-white">Premium Feature</p>
          <p className="text-sm text-zinc-500 max-w-xs">Customize your stats embed title, description, color, author, thumbnail, and which fields are shown.</p>
        </div>
        <Link
          href="/upgrade"
          className="bg-amber-500 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 transition-all active:scale-95"
        >
          Upgrade to Premium
        </Link>
      </div>
    )
  }

  const visibleFields = [
    ...(showCount ? [{ name: "Nº Vouches:", value: "42", inline: true }] : []),
    ...(showScore ? [{ name: "Score:", value: "4.8 / 5.0", inline: true }] : []),
    ...(showLeaderboard ? [{ name: "Leaderboard:", value: "#3", inline: true }] : []),
    ...(showPlan ? [{ name: "Plan:", value: "Premium Plan", inline: true }] : []),
    ...(showExpiration ? [{ name: "Premium Until:", value: "Dec 31, 2026", inline: true }] : []),
    ...(showAge ? [{ name: "Account Age:", value: "2y 4m", inline: true }] : []),
  ]

  return (
    <form action={updateStatsSettings} className="p-5 space-y-7">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form fields */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
              <input
                name="statsEmbedTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea
                name="statsEmbedDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Author Name</label>
                <input
                  name="statsEmbedAuthorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. My Store"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Author Icon URL</label>
                <input
                  name="statsEmbedAuthorIconUrl"
                  value={authorIconUrl}
                  onChange={(e) => setAuthorIconUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Thumbnail URL</label>
              <input
                name="statsEmbedThumbnailUrl"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://... (small image top-right)"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Footer Text</label>
                <input
                  name="statsEmbedFooter"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Footer Icon URL</label>
                <input
                  name="statsEmbedFooterIconUrl"
                  value={footerIconUrl}
                  onChange={(e) => setFooterIconUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Palette size={14} /> Border Color
              </label>
              <input
                type="color"
                name="statsEmbedColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1 cursor-pointer transition-all"
              />
            </div>
          </div>

          {/* Visibility toggles */}
          <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-white/5">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Visible Fields</h4>
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: "Vouch Count", name: "statsShowCount", value: showCount, set: setShowCount },
                { label: "Score", name: "statsShowScore", value: showScore, set: setShowScore },
                { label: "Leaderboard", name: "statsShowLeaderboard", value: showLeaderboard, set: setShowLeaderboard },
                { label: "Plan", name: "statsShowPlan", value: showPlan, set: setShowPlan },
                { label: "Expiration", name: "statsShowExpiration", value: showExpiration, set: setShowExpiration },
                { label: "Account Age", name: "statsShowAge", value: showAge, set: setShowAge },
              ] as const).map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
                  <p className="text-[11px] font-bold text-zinc-900 dark:text-white">{item.label}</p>
                  <input
                    type="checkbox"
                    name={item.name}
                    checked={item.value}
                    onChange={(e) => item.set(e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-3">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Live Preview</p>
          <div className="rounded-2xl bg-[#313338] p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">B</div>
              <div>
                <p className="text-[13px] font-semibold text-white leading-none">Your Bot</p>
                <p className="text-[10px] text-[#949ba4]">APP · Today</p>
              </div>
            </div>
            <EmbedPreview
              color={color}
              title={title}
              description={description || undefined}
              authorName={authorName || undefined}
              authorIconUrl={authorIconUrl || undefined}
              thumbnailUrl={thumbnailUrl || undefined}
              footerText={footer}
              footerIconUrl={footerIconUrl || undefined}
              showTimestamp
              fields={visibleFields}
            />
          </div>
          <p className="text-[10px] text-zinc-500">Preview uses sample data. Real values come from your profile.</p>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex justify-end">
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-400 transition-all active:scale-95"
        >
          Update Stats Settings
        </button>
      </div>
    </form>
  )
}
