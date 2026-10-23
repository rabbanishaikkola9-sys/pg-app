const CITY_ALIASES: Record<string, string> = {
  bengaluru: 'Bangalore',
  'bengaluru urban': 'Bangalore',
  'bengaluru rural': 'Bangalore',
  'bangalore urban': 'Bangalore',
  'bangalore rural': 'Bangalore',
};

function firstNonEmpty(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function canonicalCity(name: string): string {
  return CITY_ALIASES[name.trim().toLowerCase()] ?? name.trim();
}

export function cityFromGeocode(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  const address = data.address && typeof data.address === 'object' ? (data.address as Record<string, unknown>) : {};

  const raw = firstNonEmpty(
    data.city,
    address.city,
    data.locality,
    address.town,
    data.town,
    address.village,
    data.village,
  );
  return raw ? canonicalCity(raw) : null;
}

export function reverseGeocodeUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    localityLanguage: 'en',
  });
  return `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`;
}

export async function fetchCityFromCoords(lat: number, lon: number): Promise<string> {
  const res = await fetch(reverseGeocodeUrl(lat, lon));
  if (!res.ok) throw new Error('Could not resolve your current city.');
  const city = cityFromGeocode(await res.json());
  if (!city) throw new Error('Could not determine a city from your location.');
  return city;
}

export function readBrowserPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location is not supported in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      (error) => reject(new Error(error.message || 'Location permission denied.')),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  });
}

export async function detectCurrentCity(): Promise<string> {
  const { lat, lon } = await readBrowserPosition();
  const res = await fetch(
    `/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
  );
  const data = (await res.json().catch(() => ({}))) as { city?: unknown; error?: unknown };
  if (!res.ok || typeof data.city !== 'string' || !data.city.trim()) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not resolve your current city.');
  }
  return data.city;
}
