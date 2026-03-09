import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { dayOfWeek, mealType, dishId } = body;
  const plan = await getCurrentPlan();
  const saved = await prisma.plannedMeal.upsert({
    where: { weeklyPlanId_dayOfWeek_mealType: { weeklyPlanId: plan.id, dayOfWeek, mealType } },
    update: { dishId },
    create: { weeklyPlanId: plan.id, dayOfWeek, mealType, dishId }
  });
  return NextResponse.json({ ok: true, saved });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dayOfWeek = searchParams.get('dayOfWeek')!;
  const mealType = searchParams.get('mealType')!;
  const plan = await getCurrentPlan();
  await prisma.plannedMeal.deleteMany({ where: { weeklyPlanId: plan.id, dayOfWeek, mealType } });
  return NextResponse.json({ ok: true });
}
