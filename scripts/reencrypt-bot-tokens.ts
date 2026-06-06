// One-off migration: encrypt any bot tokens still stored as plaintext.
//
// After deploying the at-rest encryption change, existing rows keep their
// plaintext tokens until the user next saves them. This script encrypts them
// in place so nothing sensitive lingers unencrypted in the database.
//
// Idempotent: rows already in the `enc:v1:` format are skipped, so it's safe to
// run repeatedly.
//
// Usage:
//   npx tsx scripts/reencrypt-bot-tokens.ts          # dry run (no writes)
//   npx tsx scripts/reencrypt-bot-tokens.ts --apply  # perform the migration
//
// Requires TOKEN_ENCRYPTION_KEY to be set (same value as the running app).

import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { encryptSecret, isEncrypted } from "../src/lib/crypto"

const APPLY = process.argv.includes("--apply")

async function main() {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set; aborting.")
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { discordBotToken: { not: null } },
        { telegramBotToken: { not: null } },
      ],
    },
    select: { id: true, discordBotToken: true, telegramBotToken: true },
  })

  let scanned = 0
  let toMigrate = 0
  let migrated = 0

  for (const user of users) {
    const data: { discordBotToken?: string; telegramBotToken?: string } = {}

    if (user.discordBotToken && !isEncrypted(user.discordBotToken)) {
      data.discordBotToken = encryptSecret(user.discordBotToken)
    }
    if (user.telegramBotToken && !isEncrypted(user.telegramBotToken)) {
      data.telegramBotToken = encryptSecret(user.telegramBotToken)
    }

    scanned++
    if (Object.keys(data).length === 0) continue
    toMigrate++

    if (APPLY) {
      await prisma.user.update({ where: { id: user.id }, data })
      migrated++
      console.log(`encrypted token(s) for user ${user.id}: ${Object.keys(data).join(", ")}`)
    } else {
      console.log(`[dry-run] would encrypt for user ${user.id}: ${Object.keys(data).join(", ")}`)
    }
  }

  console.log(
    `\n${APPLY ? "Migrated" : "Dry run"} — users with tokens: ${scanned}, ` +
      `plaintext found: ${toMigrate}, ${APPLY ? `updated: ${migrated}` : "run with --apply to write"}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
