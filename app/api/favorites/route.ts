import { NextRequest, NextResponse } from 'next/server';
import { getDemoUser } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { dishId } = await req.json();
  const user = await getDemoUser();
  await prisma.favorite.upsert({ where: { userId_dishId: { userId: user.id, dishId } }, update: {}, create: { userId: user.id, dishId } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dishId = Number(searchParams.get('dishId'));
  const user = await getDemoUser();
  await prisma.favorite.deleteMany({ where: { userId: user.id, dishId } });
  return NextResponse.json({ ok: true });
}
