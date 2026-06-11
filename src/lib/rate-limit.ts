import { headers } from "next/headers"

// Lightweight in-process fixed-window rate limiter. The web app runs as a single
// PM2 fork, so module-level state is shared across all requests in the one
// process — good enough to blunt brute-force / email-bombing without a Redis
// dependency. (If the app is ever scaled to multiple instances, swap this for a
// shared store.)
type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()

export interface RateLimitResult {
  ok: boolean
  retryAfterMs: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterMs: 0 }
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now }
  }
  entry.count++
  return { ok: true, retryAfterMs: 0 }
}

// Periodic sweep so expired buckets don't accumulate.
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key)
  }
}, 60_000).unref?.()

// Best-effort client IP. Behind Cloudflare → origin, the real client IP is in
// cf-connecting-ip / x-forwarded-for. Falls back to a constant so a missing
// header degrades to a shared (still-limited) bucket rather than no limit.
export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  )
}

export function retryAfterText(ms: number): string {
  const mins = Math.ceil(ms / 60_000)
  if (mins <= 1) return "a minute"
  return `${mins} minutes`
}
