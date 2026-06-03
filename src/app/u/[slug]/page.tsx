import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import {
  MessageSquare,
  Star,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  ExternalLink,
  Award,
  Zap,
  Trophy,
  Flame,
  Heart,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"
import { tokensToCSS, sanitizeStyleContent, DesignTokens, defaultLightTokens, defaultDarkTokens } from "@/types/design-tokens"
import { hasActivePremium } from "@/lib/premium"
import { getSignedProofUrl } from "@/lib/proof-url"

const VOUCHES_PER_PAGE = 30

interface PublicProfileProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PublicProfileProps): Promise<Metadata> {
  const { slug } = await params
  const user = await prisma.user.findUnique({
    where: { slug },
    select: { name: true, profileMetaTitle: true, profileMetaDescription: true },
  })
  if (!user) return { title: "Profile Not Found" }
  return {
    title: user.profileMetaTitle || `${user.name || "User"}'s Vouch Profile | Vouched.to`,
    description: user.profileMetaDescription || `View verified vouches and reputation for ${user.name || "this user"} on Vouched.to.`,
  }
}

export default async function PublicProfilePage({ params, searchParams }: PublicProfileProps) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1)

  const user = await prisma.user.findUnique({ where: { slug } })
  if (!user) notFound()

  // Count + average are aggregated in the DB; only one page of vouches is loaded
  // (premium accounts can have thousands).
  const [vouchCount, ratingAgg, vouches] = await Promise.all([
    prisma.vouch.count({ where: { receiverId: user.id } }),
    prisma.vouch.aggregate({ where: { receiverId: user.id }, _avg: { rating: true } }),
    prisma.vouch.findMany({
      where: { receiverId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * VOUCHES_PER_PAGE,
      take: VOUCHES_PER_PAGE,
    }),
  ])

  const isPremium = hasActivePremium(user)
  const avgRating = ratingAgg._avg.rating ?? 0
  const totalPages = Math.max(1, Math.ceil(vouchCount / VOUCHES_PER_PAGE))

  const accentColor = user.profileAccentColor || "#6366f1"
  const theme = user.profileTheme || "dark"
  const isLight = theme === "light"
  const isGlass = theme === "glass"
  const bannerImage = user.profileBannerImage || null

  // Design token CSS from the user's saved tokens (sanitized in tokensToCSS).
  const defaults = theme === "light" ? defaultLightTokens : defaultDarkTokens
  const saved = user.profileDesignTokens as Record<string, unknown> | null
  const activeTokens = saved && "pageBgType" in saved ? (saved as unknown as DesignTokens) : defaults
  const tokenCSS = tokensToCSS(activeTokens)

  const fontMap: Record<string, string> = {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace",
  }
  const fontFamily = fontMap[user.profileFontFamily] || fontMap.sans

  // Theme-derived class sets
  const pageBg = isLight ? "bg-zinc-50" : "bg-zinc-950"
  const pageText = isLight ? "text-zinc-900" : "text-white"
  const cardBg = isLight
    ? "bg-white border-zinc-200 shadow-sm"
    : isGlass
    ? "bg-white/5 backdrop-blur-xl border-white/10"
    : "bg-zinc-900/30 border-white/5"
  const cardHover = isLight
    ? "hover:border-zinc-300 hover:bg-zinc-50"
    : isGlass
    ? "hover:bg-white/[0.08] hover:border-white/10"
    : "hover:bg-zinc-900/50 hover:border-white/10"
  const subtleText = isLight ? "text-zinc-600" : "text-zinc-400"
  const faintText = isLight ? "text-zinc-500" : "text-zinc-500"
  const divider = isLight ? "border-zinc-200" : "border-white/5"
  const tagBg = isLight ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900/50 border-white/5"
  const avatarBg = isLight ? "bg-zinc-200 border-zinc-300" : "bg-zinc-800 border-white/5"
  const initialsText = isLight ? "text-zinc-600" : "text-zinc-300"
  const vouchText = isLight ? "text-zinc-700" : "text-zinc-300"
  const giverHover = isLight ? "group-hover:text-indigo-600" : "group-hover:text-indigo-400"
  const badgeBg = isLight
    ? "bg-zinc-100 border-zinc-200 text-zinc-700"
    : "bg-zinc-900/50 border-white/5 text-white"

  return (
    <div id="vp" className={`min-h-screen ${pageBg} ${pageText} selection:bg-indigo-500/30`} style={{ fontFamily }}>
      {tokenCSS && <style dangerouslySetInnerHTML={{ __html: tokenCSS }} />}
      {isPremium && user.profileCustomCSS && (
        <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(user.profileCustomCSS) }} />
      )}
      <script dangerouslySetInnerHTML={{ __html: `(function(){window.addEventListener('message',function(e){if(e.origin!==window.location.origin)return;if(e.data&&e.data.type==='vc-preview-css'){var s=document.getElementById('vc-preview-style');if(!s){s=document.createElement('style');s.id='vc-preview-style';document.head.appendChild(s);}s.textContent=e.data.css;}});})();` }} />

      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="vc-glow-1 absolute -top-[25%] -left-[10%] w-[70%] h-[70%] blur-[120px] rounded-full opacity-15"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="vc-glow-2 absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] blur-[120px] rounded-full opacity-5"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Banner image */}
      {bannerImage && (
        <div className="relative w-full h-52 md:h-72 overflow-hidden">
          <img src={bannerImage} alt="Profile banner" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-b ${isLight ? "from-transparent to-zinc-50" : "from-transparent to-zinc-950"}`} />
        </div>
      )}

      <div className={`relative max-w-4xl mx-auto px-6 pb-12 md:pb-24 ${bannerImage ? "pt-0" : "py-12 md:py-24"}`}>
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-6">
            <div className={`vc-avatar w-24 h-24 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl border ${avatarBg}`}>
              {user.image ? (
                <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className={initialsText} />
              )}
            </div>

            <div className="space-y-3">
              <h1 className="vc-name text-4xl md:text-5xl font-extrabold tracking-tight">
                {user.name || "Anonymous User"}
              </h1>
              <div className={`vc-subtle flex flex-wrap items-center gap-3 ${subtleText}`}>
                <span className={`flex items-center gap-1.5 ${tagBg} border px-3 py-1 rounded-full text-xs font-bold`}>
                  <ShieldCheck size={13} style={{ color: accentColor }} />
                  Verified Profile
                </span>
                {isPremium && (
                  <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-bold">
                    <Zap size={13} fill="currentColor" />
                    Premium
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <MessageSquare size={13} />
                  {vouchCount} Vouches
                </span>
                {vouchCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
                    <Star size={13} fill="currentColor" />
                    {avgRating.toFixed(1)} avg
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="vc-cta self-start md:self-auto flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-extrabold transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: accentColor, color: "#fff" }}
          >
            Get Your Profile
            <ExternalLink size={14} />
          </Link>
        </header>

        {/* Stats */}
        {user.profileShowStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <StatMini label="Vouches" value={vouchCount} cardBg={cardBg} />
            <StatMini label="Rating" value={vouchCount > 0 ? `${avgRating.toFixed(1)}/5` : "—"} cardBg={cardBg} />
            <StatMini
              label="Platform"
              value={user.discordBotToken && user.telegramBotToken ? "Both" : user.telegramBotToken ? "Telegram" : "Discord"}
              cardBg={cardBg}
            />
            <StatMini
              label="Standing"
              value={vouchCount >= 100 ? "Top Tier" : vouchCount >= 25 ? "Trusted" : vouchCount >= 5 ? "Rising" : "New"}
              cardBg={cardBg}
            />
          </div>
        )}

        {/* Vouches Feed */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className={`vc-divider flex items-center justify-between border-b ${divider} pb-6`}>
            <h2 className="text-xl font-bold">Wall of Vouches</h2>
            <span className={`text-xs font-bold ${faintText} uppercase tracking-widest`}>
              Latest Activity
            </span>
          </div>

          {vouchCount === 0 ? (
            <div className={`border ${cardBg} rounded-3xl p-12 text-center`}>
              <p className={`${faintText} font-medium`}>No vouches recorded yet.</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {vouches.map((vouch) => (
                <div
                  key={vouch.id}
                  className={`vc-card border ${cardBg} ${cardHover} rounded-[28px] p-6 md:p-8 space-y-4 transition-all group`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${avatarBg} border flex items-center justify-center text-lg font-black group-hover:scale-105 transition-transform`}>
                        <span className={initialsText}>{vouch.giverName[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <h4 className={`font-bold ${giverHover} transition-colors`}>{vouch.giverName}</h4>
                        <div className={`flex items-center gap-2 text-[10px] ${faintText} mt-1 font-bold uppercase tracking-wider`}>
                          <Calendar size={10} />
                          {new Date(vouch.createdAt).toLocaleDateString()}
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                          {vouch.platform}
                        </div>
                      </div>
                    </div>
                    <div className="vc-rating flex items-center gap-1 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20">
                      <Star size={13} fill="currentColor" />
                      <span className="text-sm font-black">{vouch.rating}</span>
                    </div>
                  </div>

                  {vouch.comment && (
                    <p className={`vc-card-comment ${vouchText} leading-relaxed font-medium text-[15px]`}>
                      {vouch.comment}
                    </p>
                  )}

                  {vouch.proofImageUrl && (
                    <div className={`rounded-2xl overflow-hidden border ${divider}`}>
                      <img
                        src={getSignedProofUrl(vouch.proofImageUrl) || undefined}
                        alt="Proof"
                        className="w-full max-h-[400px] object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              {page > 1 ? (
                <a href={`?page=${page - 1}`} className={`px-4 py-2 rounded-xl border text-xs font-bold ${tagBg} ${cardHover} transition-all`}>
                  ← Newer
                </a>
              ) : <span />}
              <span className={`text-xs font-bold ${faintText} uppercase tracking-widest`}>
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <a href={`?page=${page + 1}`} className={`px-4 py-2 rounded-xl border text-xs font-bold ${tagBg} ${cardHover} transition-all`}>
                  Older →
                </a>
              ) : <span />}
            </div>
          )}
        </div>

        {/* Badges */}
        {user.profileShowBadges && vouchCount > 0 && (
          <div className="mt-20 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h3 className={`text-xs font-black ${faintText} uppercase tracking-[0.2em]`}>Earned Awards</h3>
            <div className="flex flex-wrap gap-3">
              <Badge icon={<Award size={14} />} label="Early Adopter" color="#10b981" badgeBg={badgeBg} />
              {vouchCount >= 5 && <Badge icon={<TrendingUp size={14} />} label="5+ Vouches" color="#6366f1" badgeBg={badgeBg} />}
              {vouchCount >= 10 && <Badge icon={<Star size={14} />} label="10+ Vouches" color="#f59e0b" badgeBg={badgeBg} />}
              {vouchCount >= 25 && <Badge icon={<Heart size={14} />} label="Community Favourite" color="#ec4899" badgeBg={badgeBg} />}
              {vouchCount >= 50 && <Badge icon={<ShieldCheck size={14} />} label="Trusted Seller" color="#6366f1" badgeBg={badgeBg} />}
              {vouchCount >= 100 && <Badge icon={<Trophy size={14} />} label="Hall of Fame" color="#f59e0b" badgeBg={badgeBg} />}
              {avgRating >= 4.8 && vouchCount >= 5 && <Badge icon={<Flame size={14} />} label="Top Rated" color="#f97316" badgeBg={badgeBg} />}
              {isPremium && <Badge icon={<Zap size={14} />} label="Premium Member" color="#a855f7" badgeBg={badgeBg} />}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className={`mt-24 pt-12 border-t ${divider} text-center space-y-4 opacity-40 hover:opacity-100 transition-opacity`}>
          <div className={`flex items-center justify-center gap-2 ${subtleText} text-sm font-bold`}>
            <ShieldCheck size={15} style={{ color: accentColor }} />
            Reputation verified by Vouched.to
          </div>
          <p className={`text-[10px] ${faintText} uppercase tracking-[0.3em] font-black`}>
            &copy; 2026 Vouched.to. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

function StatMini({ label, value, cardBg }: { label: string; value: string | number; cardBg: string }) {
  return (
    <div className={`vc-stat border ${cardBg} rounded-2xl p-4 text-center`}>
      <p className="vc-stat-label text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className="vc-stat-value text-lg font-black">{value}</p>
    </div>
  )
}

function Badge({ icon, label, color, badgeBg }: { icon: React.ReactNode; label: string; color: string; badgeBg: string }) {
  return (
    <div className={`vc-badge flex items-center gap-2 ${badgeBg} border px-3.5 py-2 rounded-xl text-xs font-bold`}>
      <span style={{ color }}>{icon}</span>
      {label}
    </div>
  )
}
