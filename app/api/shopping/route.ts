import { normalizeDish, parseList } from '@/lib/serializers';
import { NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/data';

export async function GET() {
  const plan = await getCurrentPlan();
  const map = new Map();
  for (const item of plan.plannedMeals as any[]) {
    const ingredients = parseList(item.dish.ingredients);
    for (const ing of ingredients) {
      const key = ing.toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    }
  }
  const grouped = Array.from(map.entries())
    .map(([ingredient, count]) => ({ ingredient, count }))
    .sort((a,b) => a.ingredient.localeCompare(b.ingredient));
  return NextResponse.json({ items: grouped });
}
