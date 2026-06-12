import { prisma } from "@/lib/prisma"
import {
  MessageSquare,
  Search,
  Trash2,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Vouch Audit</h1>
          <p className="page-subtitle">
            {total.toLocaleString()} vouch{total !== 1 ? "es" : ""} total
          </p>
        </div>

        {/* Search */}
        <form method="get" className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search giver, comment, ID…"
            className="input pl-10"
          />
          {platform && <input type="hidden" name="platform" value={platform} />}
          {status && <input type="hidden" name="status" value={status} />}
          {rating && <input type="hidden" name="rating" value={rating} />}
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
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
          <a href="/admin/vouches" className="btn-secondary !py-2 text-[13px]">
            Clear filters
          </a>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {vouches.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MessageSquare size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-500">No vouches match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-500">
                  <th className="px-5 py-3 font-medium">Giver</th>
                  <th className="px-4 py-3 text-center font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Comment</th>
                  <th className="px-4 py-3 font-medium">Receiver</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
                {vouches.map((v) => (
                  <tr key={v.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                    {/* Giver */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-[13px] font-semibold text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04]">
                          {v.giverName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[120px] truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                            {v.giverName}
                          </p>
                          <span className={v.platform === "discord" ? "chip-indigo" : "chip-sky"}>
                            {v.platform === "discord" ? "Discord" : "Telegram"}
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
                            className={i < v.rating ? "opacity-100" : "opacity-25"}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500">{v.rating}/5</span>
                    </td>

                    {/* Comment */}
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="truncate text-xs text-zinc-500" title={v.comment ?? ""}>
                        {v.comment ? `"${v.comment}"` : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                      </p>
                      {v.autoFlagReason && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-red-500" title={v.autoFlagReason}>
                          <AlertTriangle size={9} />
                          {v.autoFlagReason}
                        </p>
                      )}
                    </td>

                    {/* Receiver */}
                    <td className="px-4 py-3">
                      <p className="max-w-[120px] truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-300">
                        {v.receiver.name || v.receiver.username || v.receiver.email || "—"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={v.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <p className="whitespace-nowrap text-xs text-zinc-500">
                        {new Date(v.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {v.proofImageUrl && (
                          <a
                            href={getSignedProofUrl(v.proofImageUrl) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-500"
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
                            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
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
          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <p className="text-xs text-zinc-500">
              Showing {showing.from}–{showing.to} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <a href={buildUrl({ page: page - 1 })} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  <ChevronLeft size={15} />
                </a>
              ) : (
                <span className="p-2 text-zinc-300 dark:text-zinc-700"><ChevronLeft size={15} /></span>
              )}

              {buildPageRange(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-xs text-zinc-400">…</span>
                ) : (
                  <a
                    key={p}
                    href={buildUrl({ page: p as number })}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-red-600 text-white"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    }`}
                  >
                    {p}
                  </a>
                )
              )}

              {page < totalPages ? (
                <a href={buildUrl({ page: page + 1 })} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  <ChevronRight size={15} />
                </a>
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

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") return <span className="chip-emerald">Active</span>
  if (status === "FLAGGED") return <span className="chip-zinc !bg-red-500/10 !text-red-600 !ring-red-500/20 dark:!text-red-400">Flagged</span>
  return <span className="chip-zinc">Removed</span>
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
    <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/[0.08] dark:bg-[#101012]">
      <span className="whitespace-nowrap border-r border-zinc-200 bg-zinc-50/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-500">
        {label}
      </span>
      <div className="flex items-center">
        {options.map((opt) => (
          <a
            key={opt.value}
            href={buildUrl({ [name]: opt.value || undefined, page: 1 })}
            className={`whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors ${
              current === opt.value
                ? "bg-zinc-100 text-zinc-900 dark:bg-white/[0.06] dark:text-white"
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
