import { prisma } from "@/lib/prisma"
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { auth } from "@/auth"
import { toggleUserRole } from "../actions"
import { PremiumControl, DeleteUserButton, BanControl } from "@/components/admin/user-controls"
import type { Prisma } from "@prisma/client"

const PAGE_SIZE = 50

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await props.searchParams
  const query = q?.trim()
  const page = Math.max(1, Number(pageParam) || 1)
  const session = await auth()
  const currentUserId = session?.user?.id

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      }
    : {}

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { vouchesReceived: true } } },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (query) sp.set("q", query)
    sp.set("page", String(p))
    return `/admin/users?${sp.toString()}`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            {total.toLocaleString()} account{total !== 1 ? "s" : ""}{query ? " matching your search" : ""}.
          </p>
        </div>

        <form method="get" className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
          <input
            type="text"
            name="q"
            defaultValue={query || ""}
            placeholder="Search users..."
            className="input pl-10"
          />
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-500">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Premium</th>
                <th className="px-4 py-3 text-center font-medium">Vouches</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Bot</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-zinc-500">No users found.</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-[13px] font-medium text-zinc-500 dark:border-white/10 dark:bg-white/[0.04]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : (user.email?.[0] ?? user.username?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <Link href={`/admin/users/${user.id}`} className="mb-0.5 flex items-center gap-1.5 text-[13px] font-semibold leading-none text-zinc-900 transition-colors hover:text-red-500 dark:text-white">
                          <span className="truncate">{user.name || user.username || 'Anonymous'}</span>
                          {user.bannedAt && <span className="chip-zinc shrink-0 !bg-red-500/10 !text-red-500 !ring-red-500/20">Banned</span>}
                          <ExternalLink size={11} className="shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        <span className="truncate text-xs text-zinc-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <UserRoleBadge role={user.role} userId={user.id} />
                  </td>
                  <td className="px-4 py-3.5">
                    <PremiumControl
                      userId={user.id}
                      isPremium={user.isPremium}
                      premiumExpiresAt={user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : null}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-center text-[13px] font-semibold text-zinc-500">
                    {user._count.vouchesReceived}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="whitespace-nowrap text-xs text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${user.discordBotToken || user.telegramBotToken ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                      <span className="text-xs font-medium text-zinc-500">
                        {user.discordBotToken && user.telegramBotToken ? 'Both' : user.discordBotToken ? 'Discord' : user.telegramBotToken ? 'Telegram' : 'None'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {user.id === currentUserId ? (
                        <span className="text-xs font-medium text-zinc-400">You</span>
                      ) : (
                        <>
                          <BanControl userId={user.id} banned={!!user.bannedAt} label={user.name || user.email || user.username || "this user"} />
                          <DeleteUserButton userId={user.id} label={user.name || user.email || user.username || "this user"} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <p className="text-xs text-zinc-500">Showing {from}–{to} of {total.toLocaleString()}</p>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <a href={pageUrl(page - 1)} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white"><ChevronLeft size={15} /></a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronLeft size={15} /></span>
              )}
              <span className="px-3 text-xs font-medium text-zinc-500">Page {page} / {totalPages}</span>
              {page < totalPages ? (
                <a href={pageUrl(page + 1)} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white"><ChevronRight size={15} /></a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronRight size={15} /></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UserRoleBadge({ role, userId }: { role: string, userId: string }) {
  const isAdmin = role === 'ADMIN'
  return (
    <form action={async () => {
      'use server'
      await toggleUserRole(userId, isAdmin ? 'USER' : 'ADMIN')
    }}>
      <button
        type="submit"
        className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset transition-colors ${
          isAdmin
            ? 'bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400'
            : 'bg-zinc-500/10 text-zinc-500 ring-zinc-500/20 hover:text-zinc-700 dark:hover:text-zinc-300'
        }`}
      >
        {role}
      </button>
    </form>
  )
}
