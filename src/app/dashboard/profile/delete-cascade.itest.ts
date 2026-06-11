// Integration test for the ON DELETE CASCADE constraints that account deletion
// (Danger Zone) and admin delete-user rely on: deleting a User must remove the
// user's vouches, those vouches' reports, blacklist entries, and guild configs.
// Requires TEST_DATABASE_URL (see `test:db`).
import { test, before, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import { prisma } from "@/lib/prisma"

const U = "itest-cascade-user"

async function cleanup() {
  // Reports reference vouches; delete them first in case a test left the user.
  const vouchIds = (await prisma.vouch.findMany({ where: { receiverId: U }, select: { id: true } })).map((v) => v.id)
  if (vouchIds.length) await prisma.vouchReport.deleteMany({ where: { vouchId: { in: vouchIds } } })
  await prisma.vouch.deleteMany({ where: { receiverId: U } })
  await prisma.blacklist.deleteMany({ where: { userId: U } })
  await prisma.guildConfig.deleteMany({ where: { userId: U } })
  await prisma.user.deleteMany({ where: { id: U } })
}

before(cleanup)
beforeEach(cleanup)
after(async () => {
  await cleanup()
  await prisma.$disconnect()
})

test("deleting a user cascades to vouches, reports, blacklist and guild configs", async () => {
  await prisma.user.create({ data: { id: U, username: "itest-cascade" } })

  const vouch = await prisma.vouch.create({
    data: { receiverId: U, platform: "discord", giverId: "g1", giverName: "G", sourceId: "s1", rating: 5, comment: "ok" },
  })
  await prisma.vouchReport.create({ data: { vouchId: vouch.id, reporterId: "r1", reason: "x" } })
  await prisma.blacklist.create({ data: { userId: U, platform: "discord", blockedId: "b1" } })
  await prisma.guildConfig.create({ data: { userId: U, guildId: "g-1" } })

  // Sanity: everything exists.
  assert.equal(await prisma.vouch.count({ where: { receiverId: U } }), 1)
  assert.equal(await prisma.vouchReport.count({ where: { vouchId: vouch.id } }), 1)

  await prisma.user.delete({ where: { id: U } })

  // Everything referencing the user is gone via the cascade constraints.
  assert.equal(await prisma.user.findUnique({ where: { id: U } }), null)
  assert.equal(await prisma.vouch.count({ where: { receiverId: U } }), 0)
  assert.equal(await prisma.vouchReport.count({ where: { vouchId: vouch.id } }), 0)
  assert.equal(await prisma.blacklist.count({ where: { userId: U } }), 0)
  assert.equal(await prisma.guildConfig.count({ where: { userId: U } }), 0)
})
