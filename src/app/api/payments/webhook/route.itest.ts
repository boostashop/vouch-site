// Integration tests for the payments webhook — the premium-provisioning path,
// including the #23 ordering/replay guard. Builds real HMAC-signed requests and
// asserts the resulting DB state. Requires TEST_DATABASE_URL (see `test:db`).
import { test, before, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { POST } from "./route"

const SECRET = "itest-webhook-secret"
const USER_ID = "itest-webhook-user"

function signedRequest(
  payload: Record<string, unknown>,
  opts: { secret?: string; timestamp?: number } = {},
) {
  const secret = opts.secret ?? SECRET
  const ts = String(opts.timestamp ?? Math.floor(Date.now() / 1000))
  const body = JSON.stringify(payload)
  const signature = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex")
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: {
      "x-vouched-timestamp": ts,
      "x-vouched-signature": signature,
      "content-type": "application/json",
    },
    body,
  })
}

async function getUser() {
  return prisma.user.findUnique({
    where: { id: USER_ID },
    select: { isPremium: true, premiumExpiresAt: true, lastWebhookAt: true },
  })
}

before(() => {
  process.env.PAYMENTS_WEBHOOK_SECRET = SECRET
})

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { id: USER_ID } })
  await prisma.user.create({
    data: { id: USER_ID, username: "itest-webhook", isPremium: false },
  })
})

after(async () => {
  await prisma.user.deleteMany({ where: { id: USER_ID } })
  await prisma.$disconnect()
})

test("rejects an invalid signature with 401", async () => {
  const req = signedRequest({ event: "subscription.activated", userId: USER_ID }, { secret: "wrong-secret" })
  const res = await POST(req)
  assert.equal(res.status, 401)
  assert.equal((await getUser())?.isPremium, false)
})

test("activates premium with an expiry", async () => {
  const expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString()
  const res = await POST(signedRequest({ event: "subscription.activated", userId: USER_ID, expiresAt }))
  assert.equal(res.status, 200)
  const u = await getUser()
  assert.equal(u?.isPremium, true)
  assert.equal(u?.premiumExpiresAt?.toISOString(), expiresAt)
})

test("deactivates premium on cancellation", async () => {
  await prisma.user.update({ where: { id: USER_ID }, data: { isPremium: true } })
  const res = await POST(signedRequest({ event: "subscription.cancelled", userId: USER_ID }))
  assert.equal(res.status, 200)
  const u = await getUser()
  assert.equal(u?.isPremium, false)
  assert.equal(u?.premiumExpiresAt, null)
})

test("acknowledges an unknown event without changing state", async () => {
  const res = await POST(signedRequest({ event: "subscription.paused", userId: USER_ID }))
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, ignored: "subscription.paused" })
  assert.equal((await getUser())?.isPremium, false)
})

test("404s when the referenced user does not exist", async () => {
  const res = await POST(signedRequest({ event: "subscription.activated", userId: "nobody" }))
  assert.equal(res.status, 404)
})

test("ignores an out-of-order (older) event", async () => {
  const now = Math.floor(Date.now() / 1000)
  // Newer event activates.
  await POST(signedRequest({ event: "subscription.activated", userId: USER_ID }, { timestamp: now }))
  assert.equal((await getUser())?.isPremium, true)
  // An older 'cancelled' arriving late must NOT flip premium back off.
  const res = await POST(signedRequest({ event: "subscription.cancelled", userId: USER_ID }, { timestamp: now - 100 }))
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, stale: true })
  assert.equal((await getUser())?.isPremium, true)
})

test("ignores an exact replay (same timestamp)", async () => {
  const ts = Math.floor(Date.now() / 1000)
  await POST(signedRequest({ event: "subscription.cancelled", userId: USER_ID }, { timestamp: ts }))
  // Re-deliver the identical signed request: should be treated as stale.
  const res = await POST(signedRequest({ event: "subscription.activated", userId: USER_ID }, { timestamp: ts }))
  assert.deepEqual(await res.json(), { ok: true, stale: true })
  assert.equal((await getUser())?.isPremium, false) // stayed cancelled
})
