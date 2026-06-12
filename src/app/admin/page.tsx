import { prisma } from "@/lib/prisma"
import {
  Users,
  MessageSquare,
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="page-title">System Pulse</h1>
        <p className="page-subtitle">Real-time health and growth metrics for Vouched.to.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <PulseCard icon={<Users size={15} className="text-blue-500" />} label="Total Users" value={userCount} trend={`+${signupsToday} today`} />
        <PulseCard icon={<MessageSquare size={15} className="text-indigo-500" />} label="Total Vouches" value={vouchCount} trend={`+${vouchesToday} today`} />
        <PulseCard icon={<ShieldCheck size={15} className="text-emerald-500" />} label="Premium" value={premiumCount} trend={`${conversionRate}% conv.`} />
        <PulseCard icon={<Star size={15} className="text-yellow-500" />} label="Avg Rating" value={avgRating} trend={`${vouchCount} vouches`} />
        <PulseCard icon={<UserX size={15} className="text-rose-500" />} label="No Bot Yet" value={noBotCount} trend={`${userCount > 0 ? Math.round((noBotCount / userCount) * 100) : 0}% of users`} />
        <PulseCard icon={<Server size={15} className="text-amber-500" />} label="Bots Online" value={botsOnlineCount} trend={botsOnlineCount > 0 ? "Connected" : "None"} />
        <PulseCard icon={<AlertTriangle size={15} className="text-red-500" />} label="Flagged" value={flaggedCount} trend={flaggedCount > 0 ? "Needs review" : "All clear"} href="/admin/flagged" />
      </div>

      {/* Platform Split */}
      <div className="card p-5">
        <h2 className="card-title mb-5 flex items-center gap-2">
          <Activity size={15} className="text-indigo-500" />
          Platform Distribution
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <PlatformBar label="Discord" count={discordCount} pct={discordPct} color="bg-indigo-500" />
          <PlatformBar label="Telegram" count={telegramCount} pct={telegramPct} color="bg-sky-500" />
        </div>
      </div>

      {/* Main two-column */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Vouches Feed */}
        <div className="card lg:col-span-3">
          <div className="card-header">
            <MessageSquare size={15} className="text-indigo-500" />
            <h2 className="card-title">Recent Vouches</h2>
          </div>
          {recentVouches.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">No vouches yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
              {recentVouches.map((v) => (
                <div key={v.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center gap-0.5 rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400">
                    {v.rating}<Star size={9} className="fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">{v.giverName}</span>
                      <span className="text-[10px] text-zinc-400">→</span>
                      <span className="truncate text-xs text-indigo-600 dark:text-indigo-400">
                        {v.receiver.name || v.receiver.username || v.receiver.slug || "unknown"}
                      </span>
                      <span className={`ml-auto shrink-0 ${v.platform === "discord" ? "chip-indigo" : "chip-sky"}`}>
                        {v.platform === "discord" ? "Discord" : "Telegram"}
                      </span>
                    </div>
                    {v.comment && <p className="truncate text-xs text-zinc-500">{v.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Users Leaderboard */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <Trophy size={15} className="text-yellow-500" />
            <h2 className="card-title">Top Users</h2>
          </div>
          {topUsers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">No data yet.</p>
          ) : (
            <div className="p-2">
              {topUsers.map((u, i) => (
                <div
                  key={u.slug ?? u.username ?? i}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${
                      i === 0
                        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-500"
                        : i === 1
                        ? "bg-zinc-400/20 text-zinc-500"
                        : i === 2
                        ? "bg-amber-700/15 text-amber-700 dark:text-amber-600"
                        : "bg-zinc-100 text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                      {u.name || u.username || u.slug || "Unknown"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {u.slug ? `/${u.slug}` : u.username ? `@${u.username}` : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {u.isPremium && <span className="chip-emerald">PRO</span>}
                    <span className="text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-white">
                      {u._count.vouchesReceived}
                    </span>
                    <MessageSquare size={12} className="text-zinc-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="card p-5">
        <h2 className="card-title mb-4">Priority Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminAction
            icon={<UserCheck size={15} className="text-indigo-500" />}
            title="Manual Premium Upgrade"
            description="Manually upgrade a user by email or username."
            href="/admin/users"
          />
          <AdminAction
            icon={<ShieldCheck size={15} className="text-emerald-500" />}
            title="System Maintenance"
            description="Prune stale auth rows and review bot sync status."
            href="/admin/settings"
          />
          {flaggedCount > 0 && (
            <AdminAction
              icon={<Bell size={15} className="text-red-500" />}
              title={`${flaggedCount} Flagged Vouch${flaggedCount !== 1 ? "es" : ""}`}
              description="Content flagged by automated detection or user reports — requires review."
              href="/admin/flagged"
            />
          )}
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="card">
        <div className="card-header justify-between">
          <div className="flex items-center gap-2">
            <ScrollText size={15} className="text-red-500" />
            <h2 className="card-title">Recent Admin Activity</h2>
          </div>
          <Link href="/admin/audit" className="text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white">
            View all →
          </Link>
        </div>
        {recentAudit.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">No admin actions recorded yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
            {recentAudit.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-200">{e.summary}</p>
                  <p className="truncate text-xs text-zinc-500">{e.actorEmail || "—"}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400 dark:text-zinc-500">
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
  icon, label, value, trend, href,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  trend: string
  href?: string
}) {
  const inner = (
    <div className="card group h-full p-4 transition-colors hover:border-zinc-300 dark:hover:border-white/[0.15]">
      <div className="mb-3 flex items-center justify-between">
        <div className="card-icon">{icon}</div>
        {href && (
          <ArrowUpRight size={14} className="text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-300" />
        )}
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
      <h4 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{value}</h4>
      <p className="mt-1.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">{trend}</p>
    </div>
  )
  return href ? <a href={href}>{inner}</a> : inner
}

function PlatformBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-zinc-900 dark:text-white">{label}</span>
        <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">
          {count.toLocaleString()} <span className="font-normal text-zinc-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
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
      className="group flex items-center gap-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3.5 transition-colors hover:border-zinc-300 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/[0.15]"
    >
      <div className="card-icon">{icon}</div>
      <div className="min-w-0">
        <h4 className="card-title">{title}</h4>
        <p className="card-subtitle mt-0.5">{description}</p>
      </div>
    </a>
  )
}
