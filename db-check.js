const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cmpdww6g400008qnntk2909lc" },
    include: {
      _count: { select: { vouchesReceived: true } }
    }
  });
  
  const tgVouches = await prisma.vouch.findMany({
    where: { receiverId: "cmpdww6g400008qnntk2909lc", platform: "telegram" },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('--- DB STATE ---');
  console.log('User:', user?.username);
  console.log('Telegram ID:', user?.telegramId);
  console.log('Total Vouches:', user?._count.vouchesReceived);
  console.log('Recent Telegram Vouches:', tgVouches.length);
  tgVouches.forEach(v => console.log(`- ${v.giverName}: ${v.rating}* "${v.comment}"`));
  console.log('--- END ---');
}

main().finally(() => prisma.$disconnect());
