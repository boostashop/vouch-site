import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { Prisma } from "@prisma/client"
import { getSignedProofUrl } from "@/lib/proof-url"
import { VouchCard } from "./VouchCard"

const PER_PAGE = 20

type Filter = "all" | "active" | "flagged" | "removed"

const FILTERS: { id: Filter; label: string; where: Prisma.VouchWhereInput }[] = [
  { id: "all", label: "All", where: {} },
  { id: "active", label: "Active", where: { status: "ACTIVE" } },
  { id: "flagged", label: "Flagged", where: { status: "FLAGGED" } },
  { id: "removed", label: "Removed", where: { status: "REMOVED" } },
]

export default async function VouchesPage(props: {
  searchParams: Promise<{ page?: string; filter?: string }>
}) {
  const { page: pageParam, filter: filterParam } = await props.searchParams
  const session = await auth()
  const userId = session?.user?.id

  const filter = (FILTERS.find((f) => f.id === filterParam)?.id ?? "all") as Filter
  const filterWhere = FILTERS.find((f) => f.id === filter)!.where
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1)

  const where: Prisma.VouchWhereInput = { receiverId: userId, ...filterWhere }

  const [total, flaggedCount, vouches] = await Promise.all([
    prisma.vouch.count({ where }),
    prisma.vouch.count({ where: { receiverId: userId, status: "FLAGGED" } }),
    prisma.vouch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Your Vouches</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review, reply to, and moderate the testimonials your bots collect.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/dashboard/vouches?filter=${f.id}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              filter === f.id
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent"
                : "bg-white dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
            }`}
          >
            {f.label}
            {f.id === "flagged" && flaggedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black">{flaggedCount}</span>
            )}
          </Link>
        ))}
      </div>

      {vouches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50 dark:bg-zinc-900/10 shadow-inner">
          <MessageSquare size={64} className="mb-4 opacity-10" />
          <h3 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
            {filter === "all" ? "No vouches yet" : `No ${filter} vouches`}
          </h3>
          <p className="text-sm max-w-xs text-center mt-2 leading-relaxed">
            {filter === "all"
              ? "Your vouches will appear here automatically once your bot is connected and users start leaving feedback."
              : "Nothing here right now."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {vouches.map((vouch) => (
            <VouchCard
              key={vouch.id}
              vouch={{
                id: vouch.id,
                giverName: vouch.giverName,
                platform: vouch.platform,
                rating: vouch.rating,
                comment: vouch.comment,
                status: vouch.status,
                sellerReply: vouch.sellerReply,
                createdAt: vouch.createdAt.toISOString(),
                proofUrl: getSignedProofUrl(vouch.proofImageUrl),
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link href={`/dashboard/vouches?filter=${filter}&page=${page - 1}`} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold hover:border-zinc-300 dark:hover:border-white/20 transition-all">
              ← Newer
            </Link>
          ) : <span />}
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link href={`/dashboard/vouches?filter=${filter}&page=${page + 1}`} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold hover:border-zinc-300 dark:hover:border-white/20 transition-all">
              Older →
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  )
}
