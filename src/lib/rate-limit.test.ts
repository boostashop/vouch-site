import { test } from "node:test"
import assert from "node:assert/strict"
import { rateLimit } from "./rate-limit"

test("rateLimit allows up to the limit then blocks", () => {
  const key = `t:${Math.random()}`
  for (let i = 0; i < 3; i++) {
    assert.equal(rateLimit(key, 3, 60_000).ok, true)
  }
  const blocked = rateLimit(key, 3, 60_000)
  assert.equal(blocked.ok, false)
  assert.ok(blocked.retryAfterMs > 0)
})

test("rateLimit resets after the window elapses", () => {
  const key = `t:${Math.random()}`
  assert.equal(rateLimit(key, 1, 1).ok, true) // 1ms window
  // After the tiny window passes, the next call is a fresh bucket.
  const now = Date.now()
  while (Date.now() <= now + 2) { /* spin briefly */ }
  assert.equal(rateLimit(key, 1, 1).ok, true)
})

test("rateLimit isolates distinct keys", () => {
  const a = `a:${Math.random()}`
  const b = `b:${Math.random()}`
  assert.equal(rateLimit(a, 1, 60_000).ok, true)
  assert.equal(rateLimit(a, 1, 60_000).ok, false)
  assert.equal(rateLimit(b, 1, 60_000).ok, true) // b unaffected by a
})
