import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasActivePremium } from "@/lib/premium"
import { redirect } from "next/navigation"
import {
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Circle,
  Star,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: { vouchesReceived: { where: { status: "ACTIVE" } } }
      }
    }
  })

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [recentVouches, vouchesThisWeek] = await Promise.all([
    prisma.vouch.findMany({
      where: { receiverId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.vouch.count({
      where: { receiverId: session.user.id, status: "ACTIVE", createdAt: { gte: weekAgo } },
    }),
  ])

  const vouchCount = user?._count.vouchesReceived || 0;
  const isPremium = hasActivePremium(user);
  const hasToken = !!(user?.discordBotToken || user?.telegramBotToken);
  const botOnline = !!(user?.discordBotOnline || user?.telegramBotOnline);
  const hasBot = hasToken; // a token is configured
  const hasSlug = !!user?.slug;

  // Real health: a token present but no live client means the bot failed to
  // start (bad/revoked token) — surface that instead of a false "Online".
  const health = botOnline
    ? { value: "Online", description: "Bot connected and listening", chip: "Live", chipClass: "chip-emerald" }
    : hasToken
      ? { value: "Check token", description: "Token saved but bot isn't running", chip: "Action needed", chipClass: "chip-amber" }
      : { value: "Offline", description: "No bot token configured yet", chip: "Setup", chipClass: "chip-zinc" };

  const setupSteps = [
    {
      title: "Connect a bot",
      description: "Link a Discord or Telegram bot token to start collecting vouches.",
      href: "/dashboard/bot",
      done: hasBot,
    },
    {
      title: "Claim your public page",
      description: hasSlug
        ? `Live at vouched.to/u/${user!.slug}`
        : "Pick a profile slug to claim your vouched.to/u/ page.",
      href: "/dashboard/profile",
      done: hasSlug,
    },
    {
      title: isPremium ? "Premium active" : "Upgrade to Premium",
      description: isPremium
        ? "Unlimited storage and custom domains unlocked."
        : "Unlimited vouches, badge embeds and a custom domain.",
      href: isPremium ? "/dashboard/profile" : "/upgrade",
      done: isPremium,
    },
  ]
  const doneCount = setupSteps.filter((s) => s.done).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">
            Welcome back, {session?.user?.name || session?.user?.username || "there"}
          </h1>
          <p className="page-subtitle">
            {botOnline
              ? "Your reputation engine is active and monitoring."
              : hasToken
                ? "Your bot is configured but not running — check your token."
                : "Connect a bot to start collecting vouches."}
          </p>
        </div>
        <Link href="/dashboard/bot" className="btn-primary w-full sm:w-auto">
          <Bot size={16} />
          Manage Bot
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="card-icon">
              <MessageSquare size={15} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="chip-indigo">+{vouchesThisWeek} this week</span>
          </div>
          <p className="mt-4 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Total Vouches</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">{vouchCount}</p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Verified testimonials on record</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="card-icon">
              <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className={isPremium ? "chip-emerald" : "chip-zinc"}>{isPremium ? "Active" : "Free tier"}</span>
          </div>
          <p className="mt-4 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Account Plan</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            {isPremium ? "Premium" : "Free"}
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {isPremium ? "Unlimited vouch storage" : `${vouchCount} of 50 vouches used`}
          </p>
        </div>

        <div className="card p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="card-icon">
              <Zap size={15} className={botOnline ? "text-amber-500" : "text-zinc-400 dark:text-zinc-500"} />
            </div>
            <span className={health.chipClass}>{health.chip}</span>
          </div>
          <p className="mt-4 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Bot Status</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">{health.value}</p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{health.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Activity */}
        <div className="card lg:col-span-3">
          <div className="card-header justify-between">
            <h2 className="card-title">Recent Activity</h2>
            <Link
              href="/dashboard/vouches"
              className="flex items-center gap-1 text-[13px] font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {recentVouches.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
              {recentVouches.map((vouch) => (
                <div key={vouch.id} className="flex items-center gap-3.5 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center gap-0.5 rounded-lg bg-amber-500/10 text-[13px] font-semibold text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400">
                    {vouch.rating}
                    <Star size={10} className="fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                      {vouch.giverName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{vouch.comment || "No comment left"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={vouch.platform === "discord" ? "chip-indigo" : "chip-sky"}>
                      {vouch.platform === "discord" ? "Discord" : "Telegram"}
                    </span>
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {new Date(vouch.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="card-icon !h-11 !w-11">
                <MessageSquare size={18} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">No vouches yet</h3>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-zinc-500">
                Once your bot is connected and receiving feedback, vouches will appear here automatically.
              </p>
              <Link href="/dashboard/bot" className="btn-secondary mt-5 !py-2 text-[13px]">
                Set up your first bot
                <ArrowUpRight size={13} className="text-zinc-400" />
              </Link>
            </div>
          )}
        </div>

        {/* Setup checklist */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="card-header justify-between">
              <h2 className="card-title">Getting Started</h2>
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                {doneCount} of {setupSteps.length} complete
              </span>
            </div>
            <div className="p-2.5">
              {setupSteps.map((step) => (
                <Link
                  key={step.title}
                  href={step.href}
                  className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                >
                  {step.done ? (
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle size={17} className="mt-0.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-semibold transition-colors ${
                        step.done
                          ? "text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600"
                          : "text-zinc-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{step.description}</p>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="mt-1 shrink-0 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Public profile shortcut */}
          {hasSlug && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900 dark:text-white">
                <ExternalLink size={14} className="text-indigo-500 dark:text-indigo-400" />
                Your public page is live
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Share <span className="font-mono text-zinc-700 dark:text-zinc-300">vouched.to/u/{user!.slug}</span> with
                your customers.
              </p>
              <Link href={`/u/${user!.slug}`} target="_blank" className="btn-secondary mt-3.5 w-full !py-2 text-[13px]">
                View public profile
                <ArrowUpRight size={13} className="text-zinc-400" />
              </Link>
            </div>
          )}

          {/* Premium upsell */}
          {!isPremium && (
            <Link
              href="/upgrade"
              className="group block rounded-xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50 to-white p-5 transition-colors hover:border-indigo-300 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-transparent dark:hover:border-indigo-500/40"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900 dark:text-white">
                <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
                Unlock Premium
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Embeddable badge, unlimited vouches, custom domain &amp; Design Studio — from{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">$1.67/mo</span>, one-time payment.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 transition-colors group-hover:text-indigo-500 dark:text-indigo-400">
                View plans <ArrowRight size={13} />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
