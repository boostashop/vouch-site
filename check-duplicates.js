const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const duplicates = await prisma.$queryRaw`
    SELECT "discordBotToken", COUNT(*) 
    FROM "User" 
    WHERE "discordBotToken" IS NOT NULL 
    GROUP BY "discordBotToken" 
    HAVING COUNT(*) > 1
  `;
  console.log('Duplicate Discord Tokens:', duplicates);

  const allBots = await prisma.user.findMany({
    where: { discordBotToken: { not: null } },
    select: { id: true, username: true, discordBotToken: true }
  });
  console.log('All Bots:', allBots.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
