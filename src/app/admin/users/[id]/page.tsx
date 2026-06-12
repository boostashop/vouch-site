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
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white">
        <ArrowLeft size={15} /> Back to users
      </Link>

      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 text-xl font-semibold text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : (user.email?.[0] ?? user.username?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{user.name || user.username || "Anonymous"}</h1>
                {user.role === "ADMIN" && <span className="chip-zinc !bg-red-500/10 !text-red-600 !ring-red-500/20 dark:!text-red-400">Admin</span>}
                {premium && <span className="chip-amber">Premium</span>}
                {user.bannedAt && <span className="chip-zinc !bg-red-500/10 !text-red-600 !ring-red-500/20 dark:!text-red-400">Banned</span>}
              </div>
              <p className="mt-1 text-[13px] text-zinc-500">{user.email}</p>
              {user.slug && (
                <a href={`/u/${user.slug}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  /u/{user.slug} <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Controls */}
          {!isSelf && (
            <div className="flex flex-wrap items-center gap-2">
              <PremiumControl userId={user.id} isPremium={user.isPremium} premiumExpiresAt={user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : null} />
              <form action={async () => { "use server"; await toggleUserRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN") }}>
                <button type="submit" className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 ring-1 ring-inset ring-zinc-500/20 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300">
                  {user.role === "ADMIN" ? "Demote" : "Make admin"}
                </button>
              </form>
              <BanControl userId={user.id} banned={!!user.bannedAt} label={label} />
              <DeleteUserButton userId={user.id} label={label} />
            </div>
          )}
        </div>

        {user.bannedAt && (
          <div className="mt-5 rounded-lg border border-red-500/15 bg-red-500/5 p-4">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-red-600 dark:text-red-400">Suspended {timeAgo(user.bannedAt)}</p>
            <p className="text-[13px] text-zinc-700 dark:text-zinc-300">{user.banReason || <span className="italic text-zinc-500">No reason recorded</span>}</p>
          </div>
        )}
      </div>

      {/* Facts grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact icon={<MessageSquare size={15} className="text-indigo-500" />} label="Vouches" value={String(user._count.vouchesReceived)} />
        <Fact icon={<Calendar size={15} className="text-blue-500" />} label="Joined" value={new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
        <Fact icon={<Clock size={15} className="text-zinc-400" />} label="Last active" value={timeAgo(user.updatedAt)} />
        <Fact icon={<ShieldCheck size={15} className="text-amber-500" />} label="2FA" value={user.totpEnabled ? "Enabled" : "Off"} />
      </div>

      {/* Identity + bot status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Identity</h2>
          <div className="space-y-3">
            <Row icon={<Mail size={14} />} label="Email" value={user.email || "—"} />
            <Row icon={<AtSign size={14} />} label="Username" value={user.username || "—"} />
            <Row icon={<Globe size={14} />} label="Custom domain" value={user.customDomain || "—"} />
            <Row icon={<ShieldCheck size={14} />} label="Password set" value={user.password ? "Yes" : "No (magic-link only)"} />
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Bot status</h2>
          <div className="space-y-3">
            <BotRow platform="Discord" hasToken={!!user.discordBotToken} online={user.discordBotOnline} />
            <BotRow platform="Telegram" hasToken={!!user.telegramBotToken} online={user.telegramBotOnline} />
            <p className="flex items-center gap-1.5 pt-1 text-xs text-zinc-500">
              <Bot size={12} /> Last health check: {timeAgo(user.botCheckedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent vouches */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent vouches received</h2>
        </div>
        {recentVouches.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">No vouches yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
            {recentVouches.map((v) => (
              <div key={v.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center gap-0.5 rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400">{v.rating}★</div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">{v.giverName}</span>
                    <span className={v.platform === "discord" ? "chip-indigo" : "chip-sky"}>{v.platform === "discord" ? "Discord" : "Telegram"}</span>
                    {v.status !== "ACTIVE" && <span className="chip-zinc">{v.status}</span>}
                    <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">{new Date(v.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                  </div>
                  {v.comment && <p className="truncate text-xs text-zinc-500">{v.comment}</p>}
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
    <div className="card p-4">
      <div className="card-icon mb-3">{icon}</div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[13px] text-zinc-500"><span className="text-zinc-400">{icon}</span>{label}</span>
      <span className="max-w-[60%] truncate text-right text-[13px] font-medium text-zinc-900 dark:text-white">{value}</span>
    </div>
  )
}

function BotRow({ platform, hasToken, online }: { platform: string; hasToken: boolean; online: boolean }) {
  const state = !hasToken ? "Not configured" : online ? "Online" : "Offline"
  const dot = !hasToken ? "bg-zinc-300 dark:bg-zinc-700" : online ? "bg-emerald-500" : "bg-amber-500"
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-zinc-500">{platform}</span>
      <span className="flex items-center gap-2 text-[13px] font-medium text-zinc-900 dark:text-white">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {state}
      </span>
    </div>
  )
}
