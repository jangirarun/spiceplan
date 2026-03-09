import { normalizeDish } from '@/lib/serializers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDemoUser } from '@/lib/data';
import { canonicalizeTerm, ingredientsMatch, normalizeText, termsFromInput } from '@/lib/ingredients';

function scoreOverlap(available: string[], ingredients: string[]) {
  if (!ingredients.length) return 0;
  let score = 0;
  for (const ing of ingredients) {
    if (available.some(a => ingredientsMatch(ing, a))) score += 1;
  }
  return score / ingredients.length;
}

function computeIngredientMatches(source: any[], available: string[]) {
  return source
    .map(d => {
      const ingredients = d.ingredients.map((i: string) => normalizeText(i)).filter(Boolean);
      const matchRatio = scoreOverlap(available, ingredients);
      const matched = d.ingredients.filter((i: string) => available.some(a => ingredientsMatch(i, a)));
      const missing = d.ingredients.filter((i: string) => !available.some(a => ingredientsMatch(i, a)));
      return { ...d, matchRatio, matched, missing };
    })
    .filter(d => d.matchRatio >= 0.15 || d.matched.length >= 1)
    .sort((a, b) => b.matchRatio - a.matchRatio || a.missing.length - b.missing.length || a.prepTime - b.prepTime)
    .slice(0, 8);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const available = termsFromInput(searchParams.get('ingredients') || '');
  const dayOfWeek = searchParams.get('dayOfWeek') || '';
  const mealType = searchParams.get('mealType') || '';
  const alternativesForDishId = Number(searchParams.get('dishId') || 0);
  const user = await getDemoUser();
  const avoids = (await prisma.avoidedIngredient.findMany({ where: { userId: user.id } })).map(a => canonicalizeTerm(a.ingredient));

  let dishes = await prisma.dish.findMany({ orderBy: { name: 'asc' } });
  const normalized = dishes.map(normalizeDish).filter((d) => {
    const ingredients = d.ingredients.map(i => normalizeText(i));
    const passesAvoids = !d.ingredients.some(i => avoids.some(a => ingredientsMatch(i, a)));
    const matchesMeal = !mealType || d.mealType === mealType || (mealType === 'lunch' && d.mealType === 'dinner') || (mealType === 'dinner' && d.mealType === 'lunch');
    return passesAvoids && matchesMeal;
  });

  let alternatives: any[] = [];
  if (alternativesForDishId) {
    const current = normalized.find(d => d.id === alternativesForDishId);
    if (current) {
      const currentIngs = current.ingredients.map(i => normalizeText(i));
      alternatives = normalized
        .filter(d => d.id !== current.id)
        .map(d => {
          const ingredients = d.ingredients.map(i => normalizeText(i));
          const overlap = currentIngs.filter(ci => ingredients.some(i => ingredientsMatch(i, ci))).length;
          const regionBonus = d.region === current.region ? 1 : 0;
          const tagBonus = d.tags.some(t => current.tags.includes(t)) ? 0.5 : 0;
          return { ...d, score: overlap + regionBonus + tagBonus };
        })
        .filter(d => d.score > 0)
        .sort((a, b) => b.score - a.score || a.prepTime - b.prepTime)
        .slice(0, 6);
    }
  }

  let ingredientMatches: any[] = [];
  if (available.length) {
    ingredientMatches = computeIngredientMatches(normalized, available);
    const allMeals = dishes.map(normalizeDish).filter((d) => !d.ingredients.some(i => avoids.some(a => ingredientsMatch(i, a))));
    if (ingredientMatches.length < 3) {
      const expanded = computeIngredientMatches(allMeals, available);
      const merged = [...ingredientMatches];
      for (const dish of expanded) {
        if (!merged.some(m => m.id === dish.id)) merged.push(dish);
      }
      ingredientMatches = merged
        .sort((a, b) => (b.matchRatio || 0) - (a.matchRatio || 0) || (a.missing?.length || 0) - (b.missing?.length || 0) || a.prepTime - b.prepTime)
        .slice(0, 8);
    }
  }

  return NextResponse.json({ dayOfWeek, mealType, alternatives, ingredientMatches, normalizedAvailable: available });
}
