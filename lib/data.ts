import { prisma } from './prisma';

export async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: 'demo@spiceplan.app' },
    update: {},
    create: { email: 'demo@spiceplan.app', name: 'Demo User' }
  });
}

export async function getCurrentPlan() {
  const user = await getDemoUser();
  let plan = await prisma.weeklyPlan.findFirst({ where: { userId: user.id }, include: { plannedMeals: { include: { dish: true } } } });
  if (!plan) {
    plan = await prisma.weeklyPlan.create({ data: { userId: user.id, weekStart: 'This Week' }, include: { plannedMeals: { include: { dish: true } } } });
  }
  return plan;
}
