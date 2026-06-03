import { test } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { verifyWebhookSignature, getCheckoutUrl } from "./payments"

const SECRET = "test-secret"
const nowTs = () => Math.floor(Date.now() / 1000).toString()
const sign = (ts: string, body: string) =>
  crypto.createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex")

test("valid signature passes", () => {
  process.env.PAYMENTS_WEBHOOK_SECRET = SECRET
  const ts = nowTs()
  const body = JSON.stringify({ event: "subscription.activated", userId: "u1" })
  assert.equal(verifyWebhookSignature(body, ts, sign(ts, body)), true)
})

test("tampered body fails", () => {
  process.env.PAYMENTS_WEBHOOK_SECRET = SECRET
  const ts = nowTs()
  const body = JSON.stringify({ event: "subscription.activated" })
  const sig = sign(ts, body)
  assert.equal(verifyWebhookSignature(body + "x", ts, sig), false)
})

test("stale timestamp fails (replay protection)", () => {
  process.env.PAYMENTS_WEBHOOK_SECRET = SECRET
  const ts = (Math.floor(Date.now() / 1000) - 1000).toString()
  const body = "{}"
  assert.equal(verifyWebhookSignature(body, ts, sign(ts, body)), false)
})

test("missing secret fails closed", () => {
  delete process.env.PAYMENTS_WEBHOOK_SECRET
  assert.equal(verifyWebhookSignature("{}", nowTs(), "deadbeef"), false)
})

test("missing headers fail", () => {
  process.env.PAYMENTS_WEBHOOK_SECRET = SECRET
  assert.equal(verifyWebhookSignature("{}", null, null), false)
})

test("getCheckoutUrl builds url with ref + return", () => {
  process.env.PAYMENTS_URL = "https://pay.example.com"
  process.env.AUTH_URL = "https://vouched.to"
  const url = getCheckoutUrl("user123")
  assert.ok(url)
  const u = new URL(url!)
  assert.equal(u.searchParams.get("ref"), "user123")
  assert.equal(u.searchParams.get("return"), "https://vouched.to/dashboard")
})

test("getCheckoutUrl returns null when PAYMENTS_URL is unset", () => {
  delete process.env.PAYMENTS_URL
  assert.equal(getCheckoutUrl("u"), null)
})
