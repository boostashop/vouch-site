// Integration tests for config resolution + moderation/blacklist helpers — the
// shared logic both bots depend on. Requires TEST_DATABASE_URL (see `test:db`).
import { test, before, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import { prisma } from "./prisma"
import {
  getActiveConfig,
  reportVouch,
  getPendingReports,
  approveVouch,
  removeVouch,
  addToBlacklist,
  removeFromBlacklist,
} from "./vouch-service"

const USER = "itest-cm-user"
const OTHER = "itest-cm-other"
const GUILD = "guild-itest-1"

async function cleanup() {
  await prisma.vouch.deleteMany({ where: { receiverId: { in: [USER, OTHER] } } })
  await prisma.blacklist.deleteMany({ where: { userId: { in: [USER, OTHER] } } })
  await prisma.guildConfig.deleteMany({ where: { userId: { in: [USER, OTHER] } } })
  await prisma.user.deleteMany({ where: { id: { in: [USER, OTHER] } } })
}

async function makeVouch(receiverId: string, overrides: Record<string, unknown> = {}) {
  return prisma.vouch.create({
    data: {
      receiverId,
      platform: "discord",
      giverId: "giver-1",
      giverName: "Giver",
      sourceId: GUILD,
      rating: 5,
      comment: "great",
      ...overrides,
    },
  })
}

before(async () => {
  await cleanup()
  await prisma.user.create({
    data: { id: USER, username: "itest-cm", discordId: "disc-owner", vouchRequireProof: true },
  })
  await prisma.user.create({ data: { id: OTHER, username: "itest-cm-other" } })
})

beforeEach(async () => {
  await prisma.vouch.deleteMany({ where: { receiverId: { in: [USER, OTHER] } } })
  await prisma.blacklist.deleteMany({ where: { userId: { in: [USER, OTHER] } } })
  await prisma.guildConfig.deleteMany({ where: { userId: { in: [USER, OTHER] } } })
})

after(async () => {
  await cleanup()
  await prisma.$disconnect()
})

// ── getActiveConfig ──────────────────────────────────────────────────────────

test("getActiveConfig returns null for an unknown user", async () => {
  assert.equal(await getActiveConfig("nobody", null), null)
})

test("getActiveConfig falls back to user-level settings when no guild config", async () => {
  const cfg = await getActiveConfig(USER, null)
  assert.equal(cfg?.requireProof, true) // from user.vouchRequireProof
  assert.equal(cfg?.minAccountAgeDays, 0)
  assert.equal(cfg?.isPremium, false)
  assert.equal(cfg?.discordId, "disc-owner")
})

test("getActiveConfig prefers the per-guild config when present", async () => {
  await prisma.guildConfig.create({
    data: { userId: USER, guildId: GUILD, requireProof: false, minAccountAgeDays: 7, vouchChannelId: "chan-1" },
  })
  const cfg = await getActiveConfig(USER, GUILD)
  assert.equal(cfg?.requireProof, false) // guild overrides the user default
  assert.equal(cfg?.minAccountAgeDays, 7)
  assert.equal(cfg?.vouchChannelId, "chan-1")
})

test("getActiveConfig reflects active premium", async () => {
  await prisma.user.update({
    where: { id: USER },
    data: { isPremium: true, premiumExpiresAt: new Date(Date.now() + 86400_000) },
  })
  assert.equal((await getActiveConfig(USER, null))?.isPremium, true)
  await prisma.user.update({ where: { id: USER }, data: { isPremium: false, premiumExpiresAt: null } })
})

// ── Moderation ───────────────────────────────────────────────────────────────

test("reportVouch flags the vouch and records a report", async () => {
  const v = await makeVouch(USER)
  await reportVouch({ vouchId: v.id, reporterId: "reporter-1", reason: "fake" })
  const after = await prisma.vouch.findUnique({ where: { id: v.id } })
  assert.equal(after?.status, "FLAGGED")
  const reports = await getPendingReports(USER)
  assert.equal(reports.length, 1)
  assert.equal(reports[0].id, v.id)
})

test("approveVouch clears reports and restores ACTIVE", async () => {
  const v = await makeVouch(USER, { status: "FLAGGED" })
  await prisma.vouchReport.create({ data: { vouchId: v.id, reporterId: "r", reason: null } })
  await approveVouch(USER, v.id)
  assert.equal((await prisma.vouch.findUnique({ where: { id: v.id } }))?.status, "ACTIVE")
  assert.equal(await prisma.vouchReport.count({ where: { vouchId: v.id } }), 0)
})

test("removeVouch soft-deletes (status REMOVED)", async () => {
  const v = await makeVouch(USER)
  await removeVouch(USER, v.id)
  assert.equal((await prisma.vouch.findUnique({ where: { id: v.id } }))?.status, "REMOVED")
})

test("moderation rejects acting on someone else's vouch", async () => {
  const v = await makeVouch(USER)
  await assert.rejects(() => removeVouch(OTHER, v.id), /unauthorized/i)
  await assert.rejects(() => approveVouch(OTHER, v.id), /unauthorized/i)
})

// ── Blacklist ────────────────────────────────────────────────────────────────

test("blacklist add then remove round-trips; removing a non-entry is false", async () => {
  await addToBlacklist({ userId: USER, platform: "discord", blockedId: "bad-1", reason: "scam" })
  assert.equal(
    await prisma.blacklist.count({ where: { userId: USER, platform: "discord", blockedId: "bad-1" } }),
    1,
  )
  assert.equal(await removeFromBlacklist({ userId: USER, platform: "discord", blockedId: "bad-1" }), true)
  assert.equal(await removeFromBlacklist({ userId: USER, platform: "discord", blockedId: "bad-1" }), false)
})
