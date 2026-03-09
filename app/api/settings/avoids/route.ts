import { NextRequest, NextResponse } from 'next/server';
import { getDemoUser } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getDemoUser();
  const avoids = await prisma.avoidedIngredient.findMany({ where: { userId: user.id }, orderBy: { ingredient: 'asc' } });
  return NextResponse.json({ avoids: avoids.map(a => a.ingredient) });
}

export async function POST(req: NextRequest) {
  const { ingredient } = await req.json();
  const user = await getDemoUser();
  const value = String(ingredient).trim().toLowerCase();
  if (!value) return NextResponse.json({ ok: false }, { status: 400 });
  await prisma.avoidedIngredient.upsert({ where: { userId_ingredient: { userId: user.id, ingredient: value } }, update: {}, create: { userId: user.id, ingredient: value } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredient = String(searchParams.get('ingredient') || '').toLowerCase();
  const user = await getDemoUser();
  await prisma.avoidedIngredient.deleteMany({ where: { userId: user.id, ingredient } });
  return NextResponse.json({ ok: true });
}
