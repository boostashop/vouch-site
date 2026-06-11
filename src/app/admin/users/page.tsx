import { prisma } from "@/lib/prisma"
import { Search } from "lucide-react"
import { auth } from "@/auth"
import { toggleUserRole } from "../actions"
import { PremiumControl, DeleteUserButton } from "@/components/admin/user-controls"

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await props.searchParams
  const query = q?.trim()
  const session = await auth()
  const currentUserId = session?.user?.id

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { email: 'asc' },
    include: {
      _count: {
        select: { vouchesReceived: true }
      }
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">User Management</h1>
          <p className="text-zinc-500 mt-2 font-medium">Oversee all registered accounts and their status.</p>
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
                <th className="px-8 py-5">Bot Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-500 overflow-hidden">
                        {user.image ? <img src={user.image} alt="" /> : user.email?.[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1">{user.name || 'Anonymous'}</span>
                        <span className="text-[11px] font-medium text-zinc-500">{user.email}</span>
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
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${user.discordBotToken || user.telegramBotToken ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                       <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                         {user.discordBotToken && user.telegramBotToken ? 'Both' : user.discordBotToken ? 'Discord' : user.telegramBotToken ? 'Telegram' : 'No Bot'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end">
                      {user.id === currentUserId ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">You</span>
                      ) : (
                        <DeleteUserButton userId={user.id} label={user.name || user.email || user.username || "this user"} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
