import crypto from "crypto"

// ── Outgoing: link-out to the external payments site ────────────────────────
//
// We don't make server-to-server calls to create a checkout. The "Upgrade"
// button simply links to the payments site, passing the Vouched userId as
// `ref` so the payments site can attach the purchase to this account and echo
// the id back on its webhooks. `return` is where it should send the user after.
//
// When PAYMENTS_STORE_SLUG is set we deep-link to that store's storefront (which
// lists the Premium plans); the payments site captures `ref` and carries it
// through to checkout. Without it we fall back to the payments site root.

export function getCheckoutUrl(userId: string): string | null {
  const base = process.env.PAYMENTS_URL
  if (!base) return null
  const returnTo = process.env.AUTH_URL
    ? `${process.env.AUTH_URL.replace(/\/$/, "")}/dashboard`
    : ""
  const slug = process.env.PAYMENTS_STORE_SLUG?.trim()
  const url = new URL(slug ? `/store/${slug}` : "/", base)
  url.searchParams.set("ref", userId)
  if (returnTo) url.searchParams.set("return", returnTo)
  return url.toString()
}

// ── Incoming: HMAC verification for the payments webhook ─────────────────────
//
// The payments site signs each request as HMAC-SHA256 over `${timestamp}.${body}`
// using the shared PAYMENTS_WEBHOOK_SECRET, sending:
//   x-vouched-timestamp: <unix seconds>
//   x-vouched-signature: <hex digest>
// We verify integrity and reject anything older than the tolerance window to
// blunt replay attacks.

const REPLAY_TOLERANCE_SECONDS = 300

export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET
  if (!secret || !timestamp || !signature) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Date.now() / 1000 - ts) > REPLAY_TOLERANCE_SECONDS) return false

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")

  // Lengths must match before timingSafeEqual, or it throws.
  if (expected.length !== signature.length) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    )
  } catch {
    return false
  }
}
