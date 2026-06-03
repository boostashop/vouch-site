import { test } from "node:test"
import assert from "node:assert/strict"
import { hasActivePremium } from "./premium.ts"

test("non-premium user is not active", () => {
  assert.equal(hasActivePremium({ isPremium: false, premiumExpiresAt: null }), false)
})

test("premium with no expiry is active (payments site controls on/off)", () => {
  assert.equal(hasActivePremium({ isPremium: true, premiumExpiresAt: null }), true)
})

test("premium with a future expiry is active", () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000)
  assert.equal(hasActivePremium({ isPremium: true, premiumExpiresAt: future }), true)
})

test("premium with a past expiry has lapsed", () => {
  const past = new Date(Date.now() - 1000)
  assert.equal(hasActivePremium({ isPremium: true, premiumExpiresAt: past }), false)
})

test("null/undefined user is not active", () => {
  assert.equal(hasActivePremium(null), false)
  assert.equal(hasActivePremium(undefined), false)
})
