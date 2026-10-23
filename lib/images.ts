export const MAX_PROPERTY_IMAGES = 8;
export const MAX_IMAGE_DATA_URL_LENGTH = 900_000;

const DATA_URL_PATTERN = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/i;
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;
const RELATIVE_URL_PATTERN = /^\/[A-Za-z0-9_.\-/]+\.(png|jpe?g|webp|gif|svg)$/i;

export const DEFAULT_PG_PLACEHOLDER = '/images/placeholders/pg-room-1.svg';
export const DEFAULT_PG_PLACEHOLDERS = [DEFAULT_PG_PLACEHOLDER] as const;

export function isStoredImageUrl(value: string): boolean {
  return DATA_URL_PATTERN.test(value) || HTTP_URL_PATTERN.test(value) || RELATIVE_URL_PATTERN.test(value);
}

export function isDataUrlImage(value: string): boolean {
  return DATA_URL_PATTERN.test(value);
}

/** Keep only valid data-URL, http(s), or local image strings for `pg_properties.images`. */
export function sanitizeImageUrls(images: unknown, max = MAX_PROPERTY_IMAGES): string[] {
  if (!Array.isArray(images)) return [];

  const out: string[] = [];
  for (const item of images) {
    if (typeof item !== 'string') continue;
    const value = item.trim();
    if (!isStoredImageUrl(value)) continue;
    if (isDataUrlImage(value) && value.length > MAX_IMAGE_DATA_URL_LENGTH) continue;
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

export function firstImageUrl(images: unknown): string | null {
  const [first] = sanitizeImageUrls(images, 1);
  return first ?? null;
}

/** Returns the default PG placeholder image path. */
export function getDefaultPgPlaceholder(_seed?: string | number | null): string {
  return DEFAULT_PG_PLACEHOLDER;
}

/** Returns the first stored image URL, or falls back to a deterministic default placeholder. */
export function getPgCoverUrl(images: unknown, seed?: string | number | null): string {
  const first = firstImageUrl(images);
  return first ?? getDefaultPgPlaceholder(seed);
}
