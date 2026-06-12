import { prisma } from "@/lib/prisma"
import {
  Users,
  MessageSquare,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  UserCheck,
  Server,
  Star,
  UserX,
  Trophy,
  Activity,
  AlertTriangle,
  Bell,
  ScrollText,
} from "lucide-react"
import Link from "next/link"

export default async function AdminPulsePage() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    userCount,
    vouchCount,
    premiumCount,
    vouchesToday,
    signupsToday,
    noBotCount,
    botsOnlineCount,
    flaggedCount,
    ratingAgg,
    recentVouches,
    topUsers,
    platformGroups,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vouch.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.vouch.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({
      where: { discordBotToken: null, telegramBotToken: null },
    }),
    prisma.user.count({
      where: { OR: [{ discordBotOnline: true }, { telegramBotOnline: true }] },
    }),
    prisma.vouch.count({ where: { status: "FLAGGED" } }),
    prisma.vouch.aggregate({ _avg: { rating: true } }),
    prisma.vouch.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { receiver: { select: { name: true, username: true, slug: true } } },
    }),
    prisma.user.findMany({
      select: {
        name: true,
        username: true,
        slug: true,
        isPremium: true,
        _count: { select: { vouchesReceived: true } },
      },
      orderBy: { vouchesReceived: { _count: "desc" } },
      take: 8,
    }),
    prisma.vouch.groupBy({ by: ["platform"], _count: { _all: true } }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ])

  const conversionRate = userCount > 0
    ? ((premiumCount / userCount) * 100).toFixed(1)
    : "0.0"

  const avgRating = ratingAgg._avg.rating
    ? ratingAgg._avg.rating.toFixed(2)
    : "—"

  const discordCount = platformGroups.find((g) => g.platform === "discord")?._count._all ?? 0
  const telegramCount = platformGroups.find((g) => g.platform === "telegram")?._count._all ?? 0
  const discordPct = vouchCount > 0 ? Math.round((discordCount / vouchCount) * 100) : 0
  const telegramPct = vouchCount > 0 ? Math.round((telegramCount / vouchCount) * 100) : 0

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">System Pulse</h1>
        <p className="text-zinc-500 mt-2 font-medium">Real-time health and growth metrics for Vouched.to.</p>
      </div>

      {/* Hero Stats — 6-up */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <PulseCard
          icon={<Users className="text-blue-400" />}
          label="Total Users"
          value={userCount}
          trend={`+${signupsToday} new today`}
          color="blue"
        />
        <PulseCard
          icon={<MessageSquare className="text-indigo-400" />}
          label="Total Vouches"
          value={vouchCount}
          trend={`+${vouchesToday} today`}
          color="indigo"
        />
        <PulseCard
          icon={<ShieldCheck className="text-emerald-400" />}
          label="Premium Users"
          value={premiumCount}
          trend={`${conversionRate}% conversion`}
          color="emerald"
        />
        <PulseCard
          icon={<Star className="text-yellow-400" />}
          label="Avg Rating"
          value={avgRating}
          trend={`from ${vouchCount} vouches`}
          color="yellow"
        />
        <PulseCard
          icon={<UserX className="text-rose-400" />}
          label="No Bot Yet"
          value={noBotCount}
          trend={`${userCount > 0 ? Math.round((noBotCount / userCount) * 100) : 0}% of users`}
          color="rose"
        />
        <PulseCard
          icon={<Server className="text-amber-400" />}
          label="Bots Online"
          value={botsOnlineCount}
          trend={botsOnlineCount > 0 ? "Connected now" : "None connected"}
          color="amber"
        />
        <PulseCard
          icon={<AlertTriangle className="text-red-400" />}
          label="Flagged"
          value={flaggedCount}
          trend={flaggedCount > 0 ? "Needs review" : "All clear"}
          color="red"
          href="/admin/flagged"
        />
      </div>

      {/* Platform Split */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Activity size={18} className="text-indigo-400" />
          Platform Distribution
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <PlatformBar label="Discord" count={discordCount} pct={discordPct} color="bg-indigo-500" />
          <PlatformBar label="Telegram" count={telegramCount} pct={telegramPct} color="bg-sky-500" />
        </div>
      </div>

      {/* Main two-column */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Recent Vouches Feed */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-400" />
            Recent Vouches
          </h2>
          <div className="space-y-3">
            {recentVouches.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No vouches yet.</p>
            ) : (
              recentVouches.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-700 dark:text-zinc-300">
                    {v.rating}★
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{v.giverName}</span>
                      <span className="text-[10px] text-zinc-500">→</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 truncate">
                        {v.receiver.name || v.receiver.username || v.receiver.slug || "unknown"}
                      </span>
                      <span
                        className={`ml-auto flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                          v.platform === "discord"
                            ? "bg-indigo-500/10 text-indigo-500"
                            : "bg-sky-500/10 text-sky-500"
                        }`}
                      >
                        {v.platform}
                      </span>
                    </div>
                    {v.comment && (
                      <p className="text-[11px] text-zinc-500 truncate">{v.comment}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Users Leaderboard */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            Top Users
          </h2>
          <div className="space-y-2">
            {topUsers.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No data yet.</p>
            ) : (
              topUsers.map((u, i) => (
                <div
                  key={u.slug ?? u.username ?? i}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all"
                >
                  <span
                    className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg text-[11px] font-black ${
                      i === 0
                        ? "bg-yellow-500/20 text-yellow-500"
                        : i === 1
                        ? "bg-zinc-400/20 text-zinc-400"
                        : i === 2
                        ? "bg-amber-700/20 text-amber-700"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {u.name || u.username || u.slug || "Unknown"}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {u.slug ? `/${u.slug}` : u.username ? `@${u.username}` : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {u.isPremium && (
                      <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-md">PRO</span>
                    )}
                    <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                      {u._count.vouchesReceived}
                    </span>
                    <MessageSquare size={12} className="text-zinc-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Priority Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <AdminAction
            icon={<UserCheck className="text-indigo-400" />}
            title="Manual Premium Upgrade"
            description="Manually upgrade a user by email or username."
            href="/admin/users"
          />
          <AdminAction
            icon={<ShieldCheck className="text-emerald-400" />}
            title="System Maintenance"
            description="Prune stale auth rows and review bot sync status."
            href="/admin/settings"
          />
          {flaggedCount > 0 && (
            <AdminAction
              icon={<Bell className="text-red-400" />}
              title={`${flaggedCount} Flagged Vouch${flaggedCount !== 1 ? "es" : ""}`}
              description="Content flagged by automated detection or user reports — requires review."
              href="/admin/flagged"
            />
          )}
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ScrollText size={18} className="text-red-400" />
            Recent Admin Activity
          </h2>
          <Link href="/admin/audit" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            View all →
          </Link>
        </div>
        {recentAudit.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">No admin actions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {recentAudit.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">{e.summary}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{e.actorEmail || "—"}</p>
                </div>
                <span className="text-[10px] text-zinc-500 whitespace-nowrap flex-shrink-0">
                  {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PulseCard({
  icon, label, value, trend, color, href,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  trend: string
  color: string
  href?: string
}) {
  const inner = (
    <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-white/5">
          {icon}
        </div>
        <ArrowUpRight size={14} className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-white transition-colors" />
      </div>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-xl font-black text-zinc-900 dark:text-white">{value}</h4>
      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 mt-2 truncate">{trend}</p>
    </div>
  )
  return href ? <a href={href}>{inner}</a> : inner
}

function PlatformBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-zinc-900 dark:text-white">{label}</span>
        <span className="font-black text-zinc-900 dark:text-white tabular-nums">
          {count.toLocaleString()} <span className="text-zinc-500 font-medium">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function AdminAction({
  icon, title, description, href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h4>
        <p className="text-[11px] text-zinc-500 font-medium">{description}</p>
      </div>
    </a>
  )
}
