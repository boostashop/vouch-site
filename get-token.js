const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cmpdww6g400008qnntk2909lc" },
    select: { telegramBotToken: true }
  });
  console.log('TOKEN_START');
  console.log(user?.telegramBotToken);
  console.log('TOKEN_END');
}

main().finally(() => prisma.$disconnect());
