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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">User Management</h1>
          <p className="text-zinc-500 mt-2 font-medium">
            {total.toLocaleString()} account{total !== 1 ? "s" : ""}{query ? " matching your search" : ""}.
          </p>
        </div>

        <form method="get" className="relative w-full md:w-64">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
           <input
             type="text"
             name="q"
             defaultValue={query || ""}
             placeholder="Search users..."
             className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all outline-none"
           />
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/20">
                <th className="px-8 py-5">User</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Premium</th>
                <th className="px-6 py-5 text-center">Vouches</th>
                <th className="px-6 py-5">Joined</th>
                <th className="px-6 py-5">Bot</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-sm text-zinc-500">No users found.</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-500 overflow-hidden">
                        {user.image ? <img src={user.image} alt="" /> : (user.email?.[0] ?? user.username?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1 hover:text-red-500 transition-colors">
                          <span className="truncate">{user.name || user.username || 'Anonymous'}</span>
                          {user.bannedAt && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 flex-shrink-0">Banned</span>
                          )}
                          <ExternalLink size={11} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>
                        <span className="text-[11px] font-medium text-zinc-500 truncate">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <UserRoleBadge role={user.role} userId={user.id} />
                  </td>
                  <td className="px-6 py-5">
                    <PremiumControl
                      userId={user.id}
                      isPremium={user.isPremium}
                      premiumExpiresAt={user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : null}
                    />
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-sm text-zinc-400">
                    {user._count.vouchesReceived}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${user.discordBotToken || user.telegramBotToken ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                       <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                         {user.discordBotToken && user.telegramBotToken ? 'Both' : user.discordBotToken ? 'Discord' : user.telegramBotToken ? 'Telegram' : 'None'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {user.id === currentUserId ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">You</span>
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/20">
            <p className="text-xs font-medium text-zinc-500">Showing {from}–{to} of {total.toLocaleString()}</p>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <a href={pageUrl(page - 1)} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"><ChevronLeft size={16} /></a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronLeft size={16} /></span>
              )}
              <span className="px-3 text-xs font-bold text-zinc-500">Page {page} / {totalPages}</span>
              {page < totalPages ? (
                <a href={pageUrl(page + 1)} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"><ChevronRight size={16} /></a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronRight size={16} /></span>
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
        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
          isAdmin
            ? 'bg-red-500/10 border-red-500/20 text-red-500'
            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/10'
        }`}
      >
        {role}
      </button>
    </form>
  )
}
