const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { vouchesReceived: true }
      }
    }
  });
  console.log('Total Users:', users.length);
  console.log('Users with Slugs:', users.filter(u => u.slug).length);
  console.log('Users with Vouches:', users.filter(u => u._count.vouchesReceived > 0).length);
  console.log('Leaderboard Candidates (Slug + Vouches):', users.filter(u => u.slug && u._count.vouchesReceived > 0).length);
  
  if (users.length > 0) {
    console.log('Sample User Data:', JSON.stringify(users.slice(0, 2).map(u => ({
      id: u.id,
      slug: u.slug,
      username: u.username,
      vouchCount: u._count.vouchesReceived
    })), null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
