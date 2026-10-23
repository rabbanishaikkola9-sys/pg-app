import { z } from 'zod';
import { handle, jsonError } from '@/lib/api';
import { fetchCityFromCoords } from '@/lib/current-location';

const querySchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lon: z.coerce.number().gte(-180).lte(180),
});

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      lat: url.searchParams.get('lat'),
      lon: url.searchParams.get('lon'),
    });
    if (!parsed.success) return jsonError('A valid lat and lon are required.', 400);

    const city = await fetchCityFromCoords(parsed.data.lat, parsed.data.lon);
    return { city };
  });
}
