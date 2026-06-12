import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="page-title">Vouches</h1>
        <p className="page-subtitle">Review, reply to, and moderate the testimonials your bots collect.</p>
      </div>

      {/* Filter tabs */}
      <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-[0_1px_2px_0_rgb(0_0_0/0.03)] dark:border-white/[0.08] dark:bg-[#101012] dark:shadow-none">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/dashboard/vouches?filter=${f.id}`}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              filter === f.id
                ? "bg-zinc-100 text-zinc-900 dark:bg-white/[0.08] dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            {f.label}
            {f.id === "flagged" && flaggedCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400">
                {flaggedCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {vouches.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <div className="card-icon !h-11 !w-11">
            <MessageSquare size={18} />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
            {filter === "all" ? "No vouches yet" : `No ${filter} vouches`}
          </h3>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
            {filter === "all"
              ? "Your vouches will appear here automatically once your bot is connected and users start leaving feedback."
              : "Nothing here right now."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
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
        <div className="flex items-center justify-between pt-1">
          {page > 1 ? (
            <Link href={`/dashboard/vouches?filter=${filter}&page=${page - 1}`} className="btn-secondary !py-2 text-[13px]">
              <ChevronLeft size={14} className="text-zinc-400" /> Newer
            </Link>
          ) : <span />}
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/dashboard/vouches?filter=${filter}&page=${page + 1}`} className="btn-secondary !py-2 text-[13px]">
              Older <ChevronRight size={14} className="text-zinc-400" />
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  )
}
