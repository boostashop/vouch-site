import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Mail, AtSign, Globe, Calendar, Clock, MessageSquare,
  ShieldCheck, Bot, ExternalLink,
} from "lucide-react"
import { auth } from "@/auth"
import { toggleUserRole } from "../../actions"
import { PremiumControl, DeleteUserButton, BanControl } from "@/components/admin/user-controls"
import { hasActivePremium } from "@/lib/premium"

function timeAgo(date: Date | null): string {
  if (!date) return "never"
  const mins = Math.round((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { vouchesReceived: true } },
    },
  })
  if (!user) notFound()

  const recentVouches = await prisma.vouch.findMany({
    where: { receiverId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, giverName: true, rating: true, comment: true, platform: true, status: true, createdAt: true },
  })

  const isSelf = session?.user?.id === user.id
  const premium = hasActivePremium(user)
  const label = user.name || user.username || user.email || "this user"

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to users
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-2xl font-black text-zinc-500 overflow-hidden">
              {user.image ? <img src={user.image} alt="" /> : (user.email?.[0] ?? user.username?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{user.name || user.username || "Anonymous"}</h1>
                {user.role === "ADMIN" && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-red-500/10 text-red-500">Admin</span>
                )}
                {premium && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">Premium</span>
                )}
                {user.bannedAt && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-red-500/10 text-red-500">Banned</span>
                )}
              </div>
              <p className="text-sm text-zinc-500 font-medium mt-1">{user.email}</p>
              {user.slug && (
                <a href={`/u/${user.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-bold mt-1">
                  /u/{user.slug} <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Controls */}
          {!isSelf && (
            <div className="flex items-center gap-2 flex-wrap">
              <PremiumControl userId={user.id} isPremium={user.isPremium} premiumExpiresAt={user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : null} />
              <form action={async () => { "use server"; await toggleUserRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN") }}>
                <button type="submit" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/10 transition-all">
                  {user.role === "ADMIN" ? "Demote" : "Make admin"}
                </button>
              </form>
              <BanControl userId={user.id} banned={!!user.bannedAt} label={label} />
              <DeleteUserButton userId={user.id} label={label} />
            </div>
          )}
        </div>

        {user.bannedAt && (
          <div className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Suspended {timeAgo(user.bannedAt)}</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{user.banReason || <span className="text-zinc-500 italic">No reason recorded</span>}</p>
          </div>
        )}
      </div>

      {/* Facts grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Fact icon={<MessageSquare size={16} className="text-indigo-400" />} label="Vouches" value={String(user._count.vouchesReceived)} />
        <Fact icon={<Calendar size={16} className="text-blue-400" />} label="Joined" value={new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
        <Fact icon={<Clock size={16} className="text-zinc-400" />} label="Last active" value={timeAgo(user.updatedAt)} />
        <Fact icon={<ShieldCheck size={16} className="text-amber-400" />} label="2FA" value={user.totpEnabled ? "Enabled" : "Off"} />
      </div>

      {/* Identity + bot status */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Identity</h2>
          <Row icon={<Mail size={14} />} label="Email" value={user.email || "—"} />
          <Row icon={<AtSign size={14} />} label="Username" value={user.username || "—"} />
          <Row icon={<Globe size={14} />} label="Custom domain" value={user.customDomain || "—"} />
          <Row icon={<ShieldCheck size={14} />} label="Password set" value={user.password ? "Yes" : "No (magic-link only)"} />
        </div>
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Bot status</h2>
          <BotRow platform="Discord" hasToken={!!user.discordBotToken} online={user.discordBotOnline} />
          <BotRow platform="Telegram" hasToken={!!user.telegramBotToken} online={user.telegramBotOnline} />
          <p className="text-[11px] text-zinc-500 pt-1 flex items-center gap-1.5">
            <Bot size={12} /> Last health check: {timeAgo(user.botCheckedAt)}
          </p>
        </div>
      </div>

      {/* Recent vouches */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] p-8 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Recent vouches received</h2>
        {recentVouches.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4">No vouches yet.</p>
        ) : (
          <div className="space-y-2">
            {recentVouches.map((v) => (
              <div key={v.id} className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-700 dark:text-zinc-300">{v.rating}★</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{v.giverName}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${v.platform === "discord" ? "bg-indigo-500/10 text-indigo-500" : "bg-sky-500/10 text-sky-500"}`}>{v.platform}</span>
                    {v.status !== "ACTIVE" && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-500">{v.status}</span>
                    )}
                    <span className="ml-auto text-[10px] text-zinc-500">{new Date(v.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                  </div>
                  {v.comment && <p className="text-[11px] text-zinc-500 truncate">{v.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5">
      <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-white/5 mb-3">{icon}</div>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-black text-zinc-900 dark:text-white">{value}</p>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-xs font-bold text-zinc-500"><span className="text-zinc-400">{icon}</span>{label}</span>
      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate max-w-[60%] text-right">{value}</span>
    </div>
  )
}

function BotRow({ platform, hasToken, online }: { platform: string; hasToken: boolean; online: boolean }) {
  const state = !hasToken ? "Not configured" : online ? "Online" : "Offline"
  const dot = !hasToken ? "bg-zinc-300 dark:bg-zinc-700" : online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold text-zinc-500">{platform}</span>
      <span className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} /> {state}
      </span>
    </div>
  )
}
