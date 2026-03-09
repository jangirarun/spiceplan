export function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(",").map(s => s.trim()).filter(Boolean);
  }
}

export function stringifyList(value: string[] | unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify([]);
}

export function normalizeDish<T extends { ingredients: unknown; tags: unknown }>(dish: T) {
  return {
    ...dish,
    ingredients: parseList(dish.ingredients),
    tags: parseList(dish.tags),
  };
}
