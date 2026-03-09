import { normalizeDish } from '@/lib/serializers';
import { NextResponse } from 'next/server';
import { getCurrentPlan, getDemoUser } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [plan, user] = await Promise.all([getCurrentPlan(), getDemoUser()]);
  const favorites = await prisma.favorite.findMany({ where: { userId: user.id } });
  const avoids = await prisma.avoidedIngredient.findMany({ where: { userId: user.id } });
  return NextResponse.json({ plan: { ...plan, plannedMeals: plan.plannedMeals.map(pm => ({ ...pm, dish: normalizeDish(pm.dish as any) })) }, favorites: favorites.map(f => f.dishId), avoids: avoids.map(a => a.ingredient) });
}
