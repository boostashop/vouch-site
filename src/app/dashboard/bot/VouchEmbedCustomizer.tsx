"use client"

import { useState } from "react"
import { Lock, Palette } from "lucide-react"
import { updateVouchSettings } from "./actions"
import { EmbedPreview } from "./EmbedPreview"
import { DiscordChannelSelector } from "./DiscordChannelSelector"

interface VouchEmbedCustomizerProps {
  vouchEmbedTitle: string
  vouchEmbedFooter: string
  vouchEmbedColor: string
  vouchEmbedDescription: string | null
  vouchEmbedAuthorName: string | null
  vouchEmbedAuthorIconUrl: string | null
  vouchEmbedThumbnailUrl: string | null
  vouchEmbedFooterIconUrl: string | null
  vouchEmbedTimestamp: boolean
  vouchRequireProof: boolean
  vouchShowCount: boolean
  vouchTagUser: boolean
  vouchEmoji: string | null
  isPremium: boolean
  guilds: any[]
  initialGuildId: string
  initialChannels: any[]
  initialChannelId: string
  initialRoles: any[]
  initialRoleId: string
}

export function VouchEmbedCustomizer({
  vouchEmbedTitle,
  vouchEmbedFooter,
  vouchEmbedColor,
  vouchEmbedDescription,
  vouchEmbedAuthorName,
  vouchEmbedAuthorIconUrl,
  vouchEmbedThumbnailUrl,
  vouchEmbedFooterIconUrl,
  vouchEmbedTimestamp,
  vouchRequireProof,
  vouchShowCount,
  vouchTagUser,
  vouchEmoji,
  isPremium,
  guilds,
  initialGuildId,
  initialChannels,
  initialChannelId,
  initialRoles,
  initialRoleId,
}: VouchEmbedCustomizerProps) {
  const [color, setColor] = useState(vouchEmbedColor)
  const [title, setTitle] = useState(vouchEmbedTitle)
  const [footer, setFooter] = useState(vouchEmbedFooter)
  const [description, setDescription] = useState(vouchEmbedDescription || "")
  const [authorName, setAuthorName] = useState(vouchEmbedAuthorName || "")
  const [authorIconUrl, setAuthorIconUrl] = useState(vouchEmbedAuthorIconUrl || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(vouchEmbedThumbnailUrl || "")
  const [footerIconUrl, setFooterIconUrl] = useState(vouchEmbedFooterIconUrl || "")
  const [showTimestamp, setShowTimestamp] = useState(vouchEmbedTimestamp)
  const [showCount, setShowCount] = useState(vouchShowCount)
  const [tagUser, setTagUser] = useState(vouchTagUser)

  const previewTitle = isPremium ? title : vouchEmbedTitle
  const previewFooter = isPremium ? footer : vouchEmbedFooter

  return (
    <form action={updateVouchSettings} className="p-5 space-y-7">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form fields */}
        <div className="space-y-6">
          {/* Free: color + timestamp */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Palette size={14} /> Border Color
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">FREE</span>
              </label>
              <input
                type="color"
                name="vouchEmbedColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1 cursor-pointer transition-all"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  Show Timestamp
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">FREE</span>
                </p>
                <p className="text-[11px] text-zinc-500">Show date/time in the embed footer</p>
              </div>
              <input
                type="checkbox"
                name="vouchEmbedTimestamp"
                checked={showTimestamp}
                onChange={(e) => setShowTimestamp(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
            </div>
          </div>

          {/* Premium: title, footer, description, author, thumbnail, footer icon */}
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-white/5">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              Embed Appearance {!isPremium && <Lock size={11} className="text-amber-500" />}
            </h4>
            <div className={`space-y-4 ${!isPremium ? "opacity-50 pointer-events-none select-none" : ""}`}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                <input
                  name="vouchEmbedTitle"
                  value={isPremium ? title : vouchEmbedTitle}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!isPremium}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea
                  name="vouchEmbedDescription"
                  value={isPremium ? description : (vouchEmbedDescription || "")}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isPremium}
                  placeholder="Optional text shown below the title"
                  rows={2}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Author Name</label>
                  <input
                    name="vouchEmbedAuthorName"
                    value={isPremium ? authorName : (vouchEmbedAuthorName || "")}
                    onChange={(e) => setAuthorName(e.target.value)}
                    disabled={!isPremium}
                    placeholder="e.g. My Store"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Author Icon URL</label>
                  <input
                    name="vouchEmbedAuthorIconUrl"
                    value={isPremium ? authorIconUrl : (vouchEmbedAuthorIconUrl || "")}
                    onChange={(e) => setAuthorIconUrl(e.target.value)}
                    disabled={!isPremium}
                    placeholder="https://..."
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Thumbnail URL</label>
                <input
                  name="vouchEmbedThumbnailUrl"
                  value={isPremium ? thumbnailUrl : (vouchEmbedThumbnailUrl || "")}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  disabled={!isPremium}
                  placeholder="https://... (small image top-right)"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Footer Text</label>
                  <input
                    name="vouchEmbedFooter"
                    value={isPremium ? footer : vouchEmbedFooter}
                    onChange={(e) => setFooter(e.target.value)}
                    disabled={!isPremium}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Footer Icon URL</label>
                  <input
                    name="vouchEmbedFooterIconUrl"
                    value={isPremium ? footerIconUrl : (vouchEmbedFooterIconUrl || "")}
                    onChange={(e) => setFooterIconUrl(e.target.value)}
                    disabled={!isPremium}
                    placeholder="https://..."
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
            {!isPremium && (
              <p className="text-[10px] text-amber-500/80 font-medium">Upgrade to Premium to customize title, footer, author, and thumbnail.</p>
            )}
          </div>

          {/* Behavior toggles */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/5">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Vouch Behavior</h4>
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Require Proofs</p>
                <p className="text-[11px] text-zinc-500">Force users to upload a screenshot</p>
              </div>
              <input type="checkbox" name="vouchRequireProof" defaultChecked={vouchRequireProof} className="w-5 h-5 accent-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Show Vouch Number</p>
                <p className="text-[11px] text-zinc-500">Display the vouch count in the embed</p>
              </div>
              <input
                type="checkbox"
                name="vouchShowCount"
                checked={showCount}
                onChange={(e) => setShowCount(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Tag Giver</p>
                <p className="text-[11px] text-zinc-500">Mention the user who vouched</p>
              </div>
              <input
                type="checkbox"
                name="vouchTagUser"
                checked={tagUser}
                onChange={(e) => setTagUser(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
            </div>
          </div>

          {/* Premium: channel, role, emoji */}
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-white/5">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              Notifications {!isPremium && <Lock size={11} className="text-amber-500" />}
            </h4>
            <DiscordChannelSelector
              guilds={guilds}
              initialGuildId={initialGuildId}
              initialChannels={initialChannels}
              initialChannelId={initialChannelId}
              initialRoles={initialRoles}
              initialRoleId={initialRoleId}
              isPremium={isPremium}
            />
            <div className={`space-y-2 ${!isPremium ? "opacity-50 pointer-events-none" : ""}`}>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Success Emoji</label>
              <input
                name="vouchEmoji"
                defaultValue={vouchEmoji || "✅"}
                placeholder="✅"
                disabled={!isPremium}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>
            {!isPremium && (
              <p className="text-[10px] text-amber-500/80 font-medium">Upgrade to Premium to unlock custom channels, role mentions, and emojis.</p>
            )}
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
              title={previewTitle}
              description={isPremium && description ? description : undefined}
              authorName={isPremium && authorName ? authorName : undefined}
              authorIconUrl={isPremium && authorIconUrl ? authorIconUrl : undefined}
              thumbnailUrl={isPremium && thumbnailUrl ? thumbnailUrl : undefined}
              footerText={`${previewFooter} • ID: abc123`}
              footerIconUrl={isPremium && footerIconUrl ? footerIconUrl : undefined}
              showTimestamp={showTimestamp}
              fields={[
                { name: "Vouch:", value: "This seller is amazing! Super fast and reliable." },
                { name: "Rating:", value: "⭐⭐⭐⭐⭐", inline: true },
                ...(showCount ? [{ name: "Vouch Nº:", value: "#42", inline: true }] : []),
                ...(tagUser ? [{ name: "Vouched by:", value: "@user123", inline: true }] : []),
              ]}
            />
          </div>
          <p className="text-[10px] text-zinc-500">Preview uses sample content. Proof images appear below fields in real vouches.</p>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex justify-end">
        <button
          type="submit"
          className="bg-green-500 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-400 transition-all active:scale-95"
        >
          Update Vouch Settings
        </button>
      </div>
    </form>
  )
}
