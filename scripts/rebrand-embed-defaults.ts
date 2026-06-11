// One-off migration: rebrand stored bot-embed text from MyVouches to Vouched.to.
//
// The schema defaults were renamed (Powered by MyVouches -> Powered by
// Vouched.to, etc.), but defaults are baked into rows at creation time, so
// existing users still carry the old strings. This rewrites only rows whose
// values exactly match the old defaults — anything a user customized is left
// untouched.
//
// Idempotent: rows already on the new strings no longer match and are skipped.
//
// Usage:
//   npx tsx scripts/rebrand-embed-defaults.ts          # dry run (no writes)
//   npx tsx scripts/rebrand-embed-defaults.ts --apply  # perform the migration

import "dotenv/config"
import { prisma } from "../src/lib/prisma"

const APPLY = process.argv.includes("--apply")

const RENAMES = [
  { field: "vouchEmbedFooter", from: "Powered by MyVouches", to: "Powered by Vouched.to" },
  { field: "statsEmbedTitle", from: "MyVouches Profile Stats", to: "Vouched.to Profile Stats" },
  { field: "statsEmbedDescription", from: "Showing my MyVouches profile stats!", to: "Showing my Vouched.to profile stats!" },
  { field: "statsEmbedFooter", from: "Powered by MyVouches", to: "Powered by Vouched.to" },
] as const

async function main() {
  for (const { field, from, to } of RENAMES) {
    if (APPLY) {
      const result = await prisma.user.updateMany({
        where: { [field]: from },
        data: { [field]: to },
      })
      console.log(`${field}: updated ${result.count} row(s)`)
    } else {
      const count = await prisma.user.count({ where: { [field]: from } })
      console.log(`[dry-run] ${field}: would update ${count} row(s)`)
    }
  }
  if (!APPLY) console.log("\nRun with --apply to write.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
