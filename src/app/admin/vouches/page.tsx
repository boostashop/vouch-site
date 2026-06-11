import { prisma } from "@/lib/prisma"
import {
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  AlertTriangle,
  Image,
} from "lucide-react"
import { deleteVouch } from "../actions"
import { getSignedProofUrl } from "@/lib/proof-url"

const PAGE_SIZE = 50

export default async function AdminVouchesPage(props: {
  searchParams: Promise<{
    q?: string
    platform?: string
    status?: string
    rating?: string
    page?: string
  }>
}) {
  const params = await props.searchParams
  const q = params.q?.trim() || ""
  const platform = params.platform || ""
  const status = params.status || ""
  const rating = params.rating ? Number(params.rating) : null
  const page = Math.max(1, Number(params.page) || 1)

  const where = {
    ...(q
      ? {
          OR: [
            { giverName: { contains: q, mode: "insensitive" as const } },
            { comment: { contains: q, mode: "insensitive" as const } },
            { id: { contains: q, mode: "insensitive" as const } },
            { sourceName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(platform ? { platform } : {}),
    ...(status ? { status: status as "ACTIVE" | "FLAGGED" | "REMOVED" } : {}),
    ...(rating ? { rating } : {}),
  }

  const [total, vouches] = await Promise.all([
    prisma.vouch.count({ where }),
    prisma.vouch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        receiver: { select: { name: true, email: true, username: true } },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(overrides: Record<string, string | number | undefined>) {
    const p: Record<string, string> = {}
    if (q) p.q = q
    if (platform) p.platform = platform
    if (status) p.status = status
    if (rating) p.rating = String(rating)
    p.page = String(page)
    Object.entries(overrides).forEach(([k, v]) => {
      if (v != null && v !== "") p[k] = String(v)
      else delete p[k]
    })
    const qs = new URLSearchParams(p).toString()
    return `/admin/vouches${qs ? `?${qs}` : ""}`
  }

  const showing = {
    from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: Math.min(page * PAGE_SIZE, total),
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Vouch Audit
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">
            {total.toLocaleString()} vouch{total !== 1 ? "es" : ""} total
          </p>
        </div>

        {/* Search */}
        <form method="get" className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search giver, comment, ID…"
            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all outline-none"
          />
          {platform && <input type="hidden" name="platform" value={platform} />}
          {status && <input type="hidden" name="status" value={status} />}
          {rating && <input type="hidden" name="rating" value={rating} />}
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterSelect
          label="Platform"
          name="platform"
          current={platform}
          options={[
            { value: "", label: "All platforms" },
            { value: "discord", label: "Discord" },
            { value: "telegram", label: "Telegram" },
          ]}
          buildUrl={buildUrl}
        />
        <FilterSelect
          label="Status"
          name="status"
          current={status}
          options={[
            { value: "", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "FLAGGED", label: "Flagged" },
            { value: "REMOVED", label: "Removed" },
          ]}
          buildUrl={buildUrl}
        />
        <FilterSelect
          label="Rating"
          name="rating"
          current={rating ? String(rating) : ""}
          options={[
            { value: "", label: "Any rating" },
            { value: "5", label: "5 stars" },
            { value: "4", label: "4 stars" },
            { value: "3", label: "3 stars" },
            { value: "2", label: "2 stars" },
            { value: "1", label: "1 star" },
          ]}
          buildUrl={buildUrl}
        />
        {(q || platform || status || rating) && (
          <a
            href="/admin/vouches"
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/10 transition-all"
          >
            Clear filters
          </a>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden">
        {vouches.length === 0 ? (
          <div className="p-20 text-center">
            <MessageSquare size={40} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">No vouches match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/20">
                  <th className="px-6 py-4">Giver</th>
                  <th className="px-4 py-4 text-center">Rating</th>
                  <th className="px-4 py-4">Comment</th>
                  <th className="px-4 py-4">Receiver</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                {vouches.map((v) => (
                  <tr
                    key={v.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Giver */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-xs font-black text-zinc-500 flex-shrink-0">
                          {v.giverName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[120px]">
                            {v.giverName}
                          </p>
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              v.platform === "discord"
                                ? "bg-indigo-500/10 text-indigo-500"
                                : "bg-sky-500/10 text-sky-500"
                            }`}
                          >
                            {v.platform}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            fill={i < v.rating ? "currentColor" : "none"}
                            className={i < v.rating ? "opacity-100" : "opacity-20"}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-zinc-500">{v.rating}/5</span>
                    </td>

                    {/* Comment */}
                    <td className="px-4 py-3 max-w-[260px]">
                      <p
                        className="text-xs text-zinc-400 truncate"
                        title={v.comment ?? ""}
                      >
                        {v.comment ? (
                          <span className="italic">"{v.comment}"</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </p>
                      {v.autoFlagReason && (
                        <p className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5 truncate" title={v.autoFlagReason}>
                          <AlertTriangle size={9} />
                          {v.autoFlagReason}
                        </p>
                      )}
                    </td>

                    {/* Receiver */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 truncate max-w-[120px]">
                        {v.receiver.name || v.receiver.username || v.receiver.email || "—"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={v.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(v.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {v.proofImageUrl && (
                          <a
                            href={getSignedProofUrl(v.proofImageUrl) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                            title="View proof"
                          >
                            <Image size={14} />
                          </a>
                        )}
                        <form
                          action={async () => {
                            "use server"
                            await deleteVouch(v.id)
                          }}
                        >
                          <button
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete vouch"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/20">
            <p className="text-xs font-medium text-zinc-500">
              Showing {showing.from}–{showing.to} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <a
                  href={buildUrl({ page: page - 1 })}
                  className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"
                >
                  <ChevronLeft size={16} />
                </a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700">
                  <ChevronLeft size={16} />
                </span>
              )}

              {buildPageRange(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-zinc-500 text-xs">
                    …
                  </span>
                ) : (
                  <a
                    key={p}
                    href={buildUrl({ page: p as number })}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      p === page
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/5"
                    }`}
                  >
                    {p}
                  </a>
                )
              )}

              {page < totalPages ? (
                <a
                  href={buildUrl({ page: page + 1 })}
                  className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"
                >
                  <ChevronRight size={16} />
                </a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700">
                  <ChevronRight size={16} />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE")
    return (
      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
        Active
      </span>
    )
  if (status === "FLAGGED")
    return (
      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-red-500/10 text-red-500">
        Flagged
      </span>
    )
  return (
    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-500">
      Removed
    </span>
  )
}

function FilterSelect({
  label,
  name,
  current,
  options,
  buildUrl,
}: {
  label: string
  name: string
  current: string
  options: { value: string; label: string }[]
  buildUrl: (overrides: Record<string, string | number | undefined>) => string
}) {
  return (
    <div className="flex items-center gap-0 rounded-xl border border-zinc-200 dark:border-white/5 overflow-hidden bg-white dark:bg-zinc-900/50">
      <span className="px-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-white/5 py-2.5 bg-zinc-50 dark:bg-zinc-900/20 whitespace-nowrap">
        {label}
      </span>
      <div className="flex items-center">
        {options.map((opt) => (
          <a
            key={opt.value}
            href={buildUrl({ [name]: opt.value || undefined, page: 1 })}
            className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              current === opt.value
                ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = []
  const addPage = (p: number) => {
    if (!pages.includes(p)) pages.push(p)
  }
  addPage(1)
  if (current > 3) pages.push("…")
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) addPage(p)
  if (current < total - 2) pages.push("…")
  addPage(total)
  return pages
}
