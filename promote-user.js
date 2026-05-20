const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.update({
    where: { email: 'drspiral1@gmail.com' },
    data: { role: 'ADMIN' }
  })
  console.log('User updated:', user)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
