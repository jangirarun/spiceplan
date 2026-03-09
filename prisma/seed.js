const { PrismaClient } = require('@prisma/client');
const dishes = require('./dishes');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@spiceplan.app' },
    update: {},
    create: { email: 'demo@spiceplan.app', name: 'Demo User' }
  });

  for (const d of dishes) {
    const payload = {
      ...d,
      ingredients: JSON.stringify(d.ingredients || []),
      tags: JSON.stringify(d.tags || []),
    };
    await prisma.dish.upsert({
      where: { name: d.name },
      update: payload,
      create: payload
    });
  }

  const existing = await prisma.weeklyPlan.findFirst({ where: { userId: user.id } });
  if (!existing) {
    await prisma.weeklyPlan.create({
      data: { userId: user.id, weekStart: 'This Week' }
    });
  }

  console.log(`Seeded ${dishes.length} dishes.`);
}

main().finally(async () => prisma.$disconnect());
