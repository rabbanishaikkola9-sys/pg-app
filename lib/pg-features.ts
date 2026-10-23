export const PG_FEATURES = [
  'Wi-Fi',
  'AC',
  'Laundry',
  'Parking',
  'Gym',
  'Power Backup',
  'CCTV',
  'Mess / Food',
  'Water Purifier',
  'Hot Water',
  'Housekeeping',
  'Study Rooms',
] as const;

export type PgFeature = (typeof PG_FEATURES)[number];

export const SEARCH_FEATURES: readonly string[] = PG_FEATURES;

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function aliasKey(value: string): string {
  const normalized = normalizeToken(value);
  if (normalized === 'ac rooms') return 'ac';
  if (normalized === 'wifi') return 'wi-fi';
  if (normalized === 'meals') return 'mess / food';
  return normalized;
}

function sameFeature(left: string, right: string): boolean {
  return aliasKey(left) === aliasKey(right);
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

export function sanitizeFeatureList(value: unknown, max = 20): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of asStringList(value)) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

export type RoomFeatureSource = {
  hasAc?: boolean | null;
  features?: unknown;
};

export type PgFeatureSource = {
  amenities?: unknown;
  rooms?: RoomFeatureSource[];
};

export type FeatureFilters = {
  ac?: boolean;
  features?: string[];
};

function collectedLabels(pg: PgFeatureSource): string[] {
  const labels = asStringList(pg.amenities);
  for (const room of pg.rooms ?? []) {
    labels.push(...asStringList(room.features));
  }
  return labels;
}

export function pgHasAc(pg: PgFeatureSource): boolean {
  if ((pg.rooms ?? []).some((room) => room.hasAc === true)) return true;
  return collectedLabels(pg).some((label) => aliasKey(label) === 'ac');
}

export function pgHasFeature(pg: PgFeatureSource, feature: string): boolean {
  if (aliasKey(feature) === 'ac') return pgHasAc(pg);
  return collectedLabels(pg).some((label) => sameFeature(label, feature));
}

export function pgMatchesFeatureFilters(pg: PgFeatureSource, filters: FeatureFilters): boolean {
  const selected = [...(filters.features ?? [])];
  if (filters.ac) selected.push('AC');
  if (selected.length === 0) return true;
  return selected.some((feature) => pgHasFeature(pg, feature));
}

export function parseFeatureSearchParams(params: URLSearchParams): { ac: boolean; features: string[] } {
  const acRaw = (params.get('ac') ?? '').trim().toLowerCase();
  const ac = acRaw === 'true' || acRaw === '1' || acRaw === 'yes';
  const fromList = (params.get('features') ?? '').split(',');
  const repeated = params.getAll('feature');
  return { ac, features: sanitizeFeatureList([...repeated, ...fromList]) };
}

export function toggleListValue(list: string[], value: string, on: boolean): string[] {
  return on ? sanitizeFeatureList([...list, value]) : list.filter((item) => item !== value);
}
