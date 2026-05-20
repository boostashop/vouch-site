const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const [users, userCount, vouchCount, premiumCount] = await Promise.all([
    prisma.user.findMany({
      select: {
        email: true,
        username: true,
        role: true,
      }
    }),
    prisma.user.count(),
    prisma.vouch.count(),
    prisma.user.count({ where: { isPremium: true } })
  ])
  console.log(JSON.stringify({ users, userCount, vouchCount, premiumCount }, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
