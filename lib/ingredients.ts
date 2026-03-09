const GROUPS: Record<string, string[]> = {
  onion: ['onion', 'onions', 'pyaz', 'pyaaz', 'piyaz'],
  tomato: ['tomato', 'tomatoes', 'tamatar', 'tamaatar'],
  potato: ['potato', 'potatoes', 'aloo', 'aalu'],
  yogurt: ['yogurt', 'curd', 'dahi', 'thayir'],
  cottage_cheese: ['paneer', 'cottage cheese'],
  rice: ['rice', 'chawal', 'arisi'],
  lentils: ['dal', 'dhal', 'lentils', 'daal', 'paruppu'],
  chickpeas: ['chickpea', 'chickpeas', 'chana', 'chole', 'kadalai'],
  kidney_beans: ['kidney beans', 'rajma'],
  peas: ['peas', 'matar', 'vatana'],
  cauliflower: ['cauliflower', 'gobi', 'phool gobi'],
  cabbage: ['cabbage', 'patta gobi'],
  okra: ['okra', 'bhindi'],
  eggplant: ['eggplant', 'brinjal', 'baingan', 'aubergine'],
  bottle_gourd: ['bottle gourd', 'lauki', 'dudhi', 'ghiya'],
  bitter_gourd: ['bitter gourd', 'karela'],
  ridge_gourd: ['ridge gourd', 'turai', 'tori'],
  spinach: ['spinach', 'palak'],
  fenugreek: ['fenugreek', 'methi'],
  coriander: ['coriander', 'cilantro', 'dhania', 'kothamalli'],
  cumin: ['cumin', 'jeera'],
  mustard_seeds: ['mustard seeds', 'rai', 'sarson'],
  turmeric: ['turmeric', 'haldi'],
  chili: ['chili', 'chilies', 'chilli', 'green chili', 'red chili', 'mirch'],
  ginger: ['ginger', 'adrak', 'inji'],
  garlic: ['garlic', 'lahsun', 'poondu'],
  lemon: ['lemon', 'nimbu', 'elumichai'],
  tamarind: ['tamarind', 'imli', 'puli'],
  semolina: ['semolina', 'rava', 'sooji', 'suji'],
  flattened_rice: ['flattened rice', 'poha', 'aval'],
  vermicelli: ['vermicelli', 'sevai', 'semiya'],
  chickpea_flour: ['gram flour', 'besan', 'kadalai maavu'],
  black_gram: ['urad dal', 'udad dal', 'black gram'],
  pigeon_peas: ['toor dal', 'arhar dal', 'tuvar dal'],
  coconut: ['coconut', 'nariyal', 'thengai'],
  curry_leaves: ['curry leaves', 'kadi patta', 'kari patta'],
  bell_pepper: ['capsicum', 'bell pepper', 'shimla mirch'],
  mushroom: ['mushroom', 'khumb'],
  beetroot: ['beetroot', 'chukandar'],
  carrot: ['carrot', 'gajar'],
  beans: ['beans', 'french beans'],
};

const ALIAS_TO_CANONICAL = new Map<string, string>();
for (const [canonical, variants] of Object.entries(GROUPS)) {
  for (const variant of variants) ALIAS_TO_CANONICAL.set(variant, canonical);
}

export function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalizeTerm(value: string) {
  const normalized = normalizeText(value);
  return ALIAS_TO_CANONICAL.get(normalized) || normalized;
}

export function ingredientForms(value: string) {
  const normalized = normalizeText(value);
  const set = new Set<string>();
  if (!normalized) return set;

  set.add(normalized);
  set.add(canonicalizeTerm(normalized));

  for (const part of normalized.split(' ')) {
    if (!part) continue;
    set.add(part);
    set.add(canonicalizeTerm(part));
  }

  for (const [canonical, variants] of Object.entries(GROUPS)) {
    if (variants.some(v => normalized.includes(v))) {
      set.add(canonical);
      for (const variant of variants) set.add(variant);
    }
  }

  return set;
}

export function termsFromInput(input: string) {
  return input
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => canonicalizeTerm(v));
}

export function ingredientsMatch(a: string, b: string) {
  const aForms = ingredientForms(a);
  const bForms = ingredientForms(b);
  for (const form of aForms) {
    if (bForms.has(form)) return true;
  }
  for (const fa of aForms) {
    for (const fb of bForms) {
      if (fa && fb && (fa.includes(fb) || fb.includes(fa))) return true;
    }
  }
  return false;
}
