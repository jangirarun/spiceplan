import { normalizeDish, parseList } from '@/lib/serializers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDemoUser } from '@/lib/data';
import { canonicalizeTerm, ingredientsMatch } from '@/lib/ingredients';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = canonicalizeTerm(searchParams.get('q') || '');
  const meal = searchParams.get('meal') || '';
  const region = searchParams.get('region') || '';
  const favOnly = searchParams.get('favorites') === '1';
  const user = await getDemoUser();
  const favorites = await prisma.favorite.findMany({ where: { userId: user.id } });
  const avoids = (await prisma.avoidedIngredient.findMany({ where: { userId: user.id } })).map(a => canonicalizeTerm(a.ingredient));
  const favoriteIds = new Set(favorites.map(f => f.dishId));
  let dishes = await prisma.dish.findMany({ orderBy: { name: 'asc' } });
  dishes = dishes.filter((d) => {
    const ingredients = parseList(d.ingredients);
    const matchesQ = !q || d.name.toLowerCase().includes(q) || ingredients.some(i => ingredientsMatch(i, q));
    const matchesMeal = !meal || d.mealType === meal || (meal === 'lunch' && d.mealType === 'dinner') || (meal === 'dinner' && d.mealType === 'lunch');
    const matchesRegion = !region || d.region.toLowerCase().includes(region.toLowerCase());
    const passesAvoids = !ingredients.some(i => avoids.some(a => ingredientsMatch(i, a)));
    const passesFav = !favOnly || favoriteIds.has(d.id);
    return matchesQ && matchesMeal && matchesRegion && passesAvoids && passesFav;
  });
  return NextResponse.json({ dishes: dishes.map(normalizeDish), favoriteIds: Array.from(favoriteIds), avoids });
}


export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  const mealType = String(body.mealType || '').trim().toLowerCase();
  const region = String(body.region || '').trim();
  const prepTime = Number(body.prepTime || 20);
  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.map((v: unknown) => String(v).trim()).filter(Boolean)
    : String(body.ingredients || '').split(',').map(v => v.trim()).filter(Boolean);
  const tags = Array.isArray(body.tags)
    ? body.tags.map((v: unknown) => String(v).trim()).filter(Boolean)
    : String(body.tags || '').split(',').map(v => v.trim()).filter(Boolean);
  const recipe = String(body.recipe || '').trim();

  if (!name || !mealType || !region || !recipe || !ingredients.length) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  const allowedMeals = ['breakfast', 'lunch', 'dinner'];
  if (!allowedMeals.includes(mealType)) {
    return NextResponse.json({ ok: false, error: 'Invalid meal type' }, { status: 400 });
  }

  const dish = await prisma.dish.create({
    data: {
      name,
      mealType,
      region,
      prepTime: Number.isFinite(prepTime) ? prepTime : 20,
      ingredients: JSON.stringify(ingredients),
      tags: JSON.stringify(tags),
      recipe,
    }
  });

  return NextResponse.json({ ok: true, dish: normalizeDish(dish) });
}
