import { and, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pgProperties, profiles } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { sanitizeImageUrls } from '@/lib/images';
import { parseFeatureSearchParams, pgMatchesFeatureFilters } from '@/lib/pg-features';
import { listRoomFeatureSourcesByPgIds } from '@/lib/rooms';

const createSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(3),
  city: z.string().default(''),
  state: z.string().default(''),
  pincode: z.string().default(''),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  totalRooms: z.coerce.number().int().min(0).default(0),
  rentRangeMin: z.coerce.number().nonnegative().optional(),
  rentRangeMax: z.coerce.number().nonnegative().optional(),
  ownerId: z.string().uuid().optional(),
  images: z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const search = url.searchParams.get('q')?.trim();
    const city = url.searchParams.get('city')?.trim();
    const ownerId = url.searchParams.get('ownerId');
    const minPrice = Number(url.searchParams.get('minPrice') ?? '');
    const maxPrice = Number(url.searchParams.get('maxPrice') ?? '');
    const onlyActive = url.searchParams.get('active') === 'true';
    const featureFilters = parseFeatureSearchParams(url.searchParams);

    const conditions = [] as ReturnType<typeof eq>[];
    if (search) {
      const matchSearch = or(ilike(pgProperties.name, `%${search}%`), ilike(pgProperties.address, `%${search}%`));
      if (matchSearch) conditions.push(matchSearch);
    }
    if (city) conditions.push(ilike(pgProperties.city, `%${city}%`));
    if (ownerId) conditions.push(eq(pgProperties.ownerId, ownerId));
    if (onlyActive) conditions.push(eq(pgProperties.isActive, true));
    if (!Number.isNaN(minPrice) && minPrice > 0) {
      conditions.push(gte(pgProperties.rentRangeMin, String(minPrice)));
    }
    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      conditions.push(lte(pgProperties.rentRangeMax, String(maxPrice)));
    }

    const rows = await db
      .select({
        id: pgProperties.id,
        name: pgProperties.name,
        description: pgProperties.description,
        address: pgProperties.address,
        city: pgProperties.city,
        state: pgProperties.state,
        pincode: pgProperties.pincode,
        amenities: pgProperties.amenities,
        images: pgProperties.images,
        totalRooms: pgProperties.totalRooms,
        occupiedRooms: pgProperties.occupiedRooms,
        rentRangeMin: pgProperties.rentRangeMin,
        rentRangeMax: pgProperties.rentRangeMax,
        isActive: pgProperties.isActive,
        ownerId: pgProperties.ownerId,
        ownerName: profiles.fullName,
        createdAt: pgProperties.createdAt,
      })
      .from(pgProperties)
      .leftJoin(profiles, eq(profiles.id, pgProperties.ownerId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(pgProperties.createdAt))
      .limit(500);

    if (!featureFilters.ac && featureFilters.features.length === 0) {
      return { pgs: rows };
    }

    const ids = rows.map((row) => row.id);
    const roomRows = await listRoomFeatureSourcesByPgIds(ids);

    const roomsByPg = new Map<string, typeof roomRows>();
    for (const room of roomRows) {
      const list = roomsByPg.get(room.pgId) ?? [];
      list.push(room);
      roomsByPg.set(room.pgId, list);
    }

    return {
      pgs: rows.filter((pg) =>
        pgMatchesFeatureFilters({ amenities: pg.amenities, rooms: roomsByPg.get(pg.id) ?? [] }, featureFilters),
      ),
    };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireRole('ADMIN', 'MANAGER');
    const body = createSchema.parse(await req.json());

    const ownerId = user.role === 'ADMIN' ? body.ownerId : user.id;
    if (!ownerId) return jsonError('ownerId is required.', 400);

    const [owner] = await db
      .select({ id: profiles.id, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, ownerId))
      .limit(1);
    if (!owner) return jsonError('Owner not found.', 404);
    if (owner.role !== 'MANAGER') return jsonError('Owner profile must have PG Owner role.', 400);

    const [created] = await db
      .insert(pgProperties)
      .values({
        ownerId,
        name: body.name,
        description: body.description ?? null,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        amenities: body.amenities as unknown as object,
        images: sanitizeImageUrls(body.images),
        totalRooms: body.totalRooms,
        rentRangeMin: body.rentRangeMin != null ? String(body.rentRangeMin) : null,
        rentRangeMax: body.rentRangeMax != null ? String(body.rentRangeMax) : null,
      })
      .returning();

    return { pg: created };
  });
}
