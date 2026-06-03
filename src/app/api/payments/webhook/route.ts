import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature } from "@/lib/payments"

// Incoming payment events from the external payments site.
// Auth: HMAC-SHA256 over `${timestamp}.${rawBody}` with PAYMENTS_WEBHOOK_SECRET.
//
// Expected body:
//   {
//     "event":      "subscription.activated" | "subscription.renewed"
//                 | "subscription.cancelled" | "subscription.expired",
//     "userId":     "<vouched user id>",   // the `ref` we passed at checkout
//     "customerId": "<payments-site customer id>",  // stored for future lookups
//     "expiresAt":  "2026-07-03T00:00:00.000Z" | null  // when premium lapses
//   }
// At least one of userId / customerId must be present.

const ACTIVATING = new Set([
  "subscription.activated",
  "subscription.renewed",
  "payment.succeeded",
])
const DEACTIVATING = new Set([
  "subscription.cancelled",
  "subscription.expired",
  "payment.refunded",
])

export async function POST(request: Request) {
  const rawBody = await request.text()

  if (
    !verifyWebhookSignature(
      rawBody,
      request.headers.get("x-vouched-timestamp"),
      request.headers.get("x-vouched-signature"),
    )
  ) {
    return Response.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: {
    event?: string
    userId?: string
    customerId?: string
    expiresAt?: string | null
  }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { event, userId, customerId, expiresAt } = payload
  if (!event) {
    return Response.json({ error: "Missing event" }, { status: 400 })
  }
  if (!userId && !customerId) {
    return Response.json(
      { error: "Missing userId or customerId" },
      { status: 400 },
    )
  }

  // Resolve the user: prefer the explicit ref, fall back to the stored mapping.
  const user = await prisma.user.findFirst({
    where: userId ? { id: userId } : { paymentCustomerId: customerId },
    select: { id: true },
  })
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  if (ACTIVATING.has(event)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: true,
        premiumExpiresAt: expiresAt ? new Date(expiresAt) : null,
        ...(customerId ? { paymentCustomerId: customerId } : {}),
      },
    })
  } else if (DEACTIVATING.has(event)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isPremium: false, premiumExpiresAt: null },
    })
  } else {
    // Unknown event — acknowledge so the payments site doesn't retry forever.
    return Response.json({ ok: true, ignored: event })
  }

  return Response.json({ ok: true })
}
