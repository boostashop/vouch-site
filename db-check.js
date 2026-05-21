const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cmpdww6g400008qnntk2909lc" },
    select: { telegramId: true, username: true }
  });
  console.log('DB_CHECK_START');
  console.log(JSON.stringify(user));
  console.log('DB_CHECK_END');
}

main().finally(() => prisma.$disconnect());
