// Integration tests for the anti-abuse rules — these hit a real Postgres test
// database (TEST_DATABASE_URL, wired via the `test:db` script / CI service), so
// they exercise the actual queries rather than mocks.
//
// Run locally:  TEST_DATABASE_URL=postgres://…/vouchdb_test npm run test:db
import { test, before, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import { prisma } from "./prisma"
import { validateVouchRules, addToBlacklist } from "./vouch-service"

const RECEIVER = "itest-receiver"
const OWNER_DISCORD = "itest-owner-discord"
const GIVER = "itest-giver-discord"

async function cleanup() {
  await prisma.vouch.deleteMany({ where: { receiverId: RECEIVER } })
  await prisma.blacklist.deleteMany({ where: { userId: RECEIVER } })
  await prisma.user.deleteMany({ where: { id: RECEIVER } })
}

before(async () => {
  await cleanup()
  await prisma.user.create({
    data: { id: RECEIVER, username: "itest-recv", slug: "itest-recv", discordId: OWNER_DISCORD },
  })
})

after(async () => {
  await cleanup()
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Reset per-test state that the rules read (vouch history, blacklist).
  await prisma.vouch.deleteMany({ where: { receiverId: RECEIVER } })
  await prisma.blacklist.deleteMany({ where: { userId: RECEIVER } })
})

test("rejects a comment shorter than 4 chars", async () => {
  await assert.rejects(
    () => validateVouchRules({ receiverId: RECEIVER, giverId: GIVER, platform: "discord", comment: "hi" }),
    /at least 4/,
  )
})

test("rejects a self-vouch (giver is the profile owner)", async () => {
  await assert.rejects(
    () => validateVouchRules({ receiverId: RECEIVER, giverId: OWNER_DISCORD, platform: "discord", comment: "great seller!" }),
    /yourself/,
  )
})

test("rejects a blacklisted giver", async () => {
  await addToBlacklist({ userId: RECEIVER, platform: "discord", blockedId: GIVER, reason: "spam" })
  await assert.rejects(
    () => validateVouchRules({ receiverId: RECEIVER, giverId: GIVER, platform: "discord", comment: "great seller!" }),
    /blacklisted/,
  )
})

test("rejects an unknown receiver", async () => {
  await assert.rejects(
    () => validateVouchRules({ receiverId: "does-not-exist", giverId: GIVER, platform: "discord", comment: "great seller!" }),
    /not found/,
  )
})

test("enforces the 3-per-24h cooldown", async () => {
  for (let i = 0; i < 3; i++) {
    await prisma.vouch.create({
      data: {
        receiverId: RECEIVER,
        platform: "discord",
        giverId: GIVER,
        giverName: "Giver",
        sourceId: "guild-1",
        rating: 5,
        comment: `vouch ${i}`,
      },
    })
  }
  await assert.rejects(
    () => validateVouchRules({ receiverId: RECEIVER, giverId: GIVER, platform: "discord", comment: "one too many" }),
    /Rate limit/,
  )
})

test("allows a valid vouch from a fresh giver", async () => {
  await assert.doesNotReject(() =>
    validateVouchRules({ receiverId: RECEIVER, giverId: GIVER, platform: "discord", comment: "great seller!" }),
  )
})

test("counts only the last 24h toward the cooldown", async () => {
  // Three old vouches (2 days ago) shouldn't block a new one.
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  for (let i = 0; i < 3; i++) {
    await prisma.vouch.create({
      data: {
        receiverId: RECEIVER,
        platform: "discord",
        giverId: GIVER,
        giverName: "Giver",
        sourceId: "guild-1",
        rating: 5,
        comment: `old vouch ${i}`,
        createdAt: twoDaysAgo,
      },
    })
  }
  await assert.doesNotReject(() =>
    validateVouchRules({ receiverId: RECEIVER, giverId: GIVER, platform: "discord", comment: "fresh after cooldown" }),
  )
})
