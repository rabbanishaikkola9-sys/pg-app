import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pgProperties, profiles } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { sanitizeImageUrls } from '@/lib/images';
import { isPgId } from '@/lib/pg-id';
import { listRoomsByPgId } from '@/lib/rooms';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  address: z.string().min(3).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  totalRooms: z.coerce.number().int().min(0).optional(),
  rentRangeMin: z.coerce.number().nonnegative().nullable().optional(),
  rentRangeMax: z.coerce.number().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  return handle(async () => {
    const { id } = await params;
    if (!isPgId(id)) return jsonError('PG not found', 404);
    const [pg] = await db
      .select({
        pg: pgProperties,
        ownerName: profiles.fullName,
        ownerEmail: profiles.email,
        ownerPhone: profiles.phone,
      })
      .from(pgProperties)
      .leftJoin(profiles, eq(profiles.id, pgProperties.ownerId))
      .where(eq(pgProperties.id, id))
      .limit(1);
    if (!pg) return jsonError('PG not found', 404);
    const roomRows = await listRoomsByPgId(id);
    return { pg: pg.pg, owner: { name: pg.ownerName, email: pg.ownerEmail, phone: pg.ownerPhone }, rooms: roomRows };
  });
}

export async function PUT(req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await requireRole('ADMIN', 'MANAGER');
    const { id } = await params;
    if (!isPgId(id)) return jsonError('PG not found', 404);
    const body = updateSchema.parse(await req.json());

    const [existing] = await db.select().from(pgProperties).where(eq(pgProperties.id, id)).limit(1);
    if (!existing) return jsonError('PG not found', 404);
    if (user.role === 'MANAGER' && existing.ownerId !== user.id) return jsonError('Forbidden', 403);

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.address !== undefined) patch.address = body.address;
    if (body.city !== undefined) patch.city = body.city;
    if (body.state !== undefined) patch.state = body.state;
    if (body.pincode !== undefined) patch.pincode = body.pincode;
    if (body.amenities !== undefined) patch.amenities = body.amenities;
    if (body.totalRooms !== undefined) patch.totalRooms = body.totalRooms;
    if (body.rentRangeMin !== undefined)
      patch.rentRangeMin = body.rentRangeMin == null ? null : String(body.rentRangeMin);
    if (body.rentRangeMax !== undefined)
      patch.rentRangeMax = body.rentRangeMax == null ? null : String(body.rentRangeMax);
    if (body.isActive !== undefined) patch.isActive = body.isActive;
    if (body.images !== undefined) patch.images = sanitizeImageUrls(body.images);

    const [updated] = await db.update(pgProperties).set(patch).where(eq(pgProperties.id, id)).returning();
    return { pg: updated };
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return jsonError('Not authenticated', 401);
    const { id } = await params;
    if (!isPgId(id)) return jsonError('PG not found', 404);
    const [existing] = await db.select().from(pgProperties).where(eq(pgProperties.id, id)).limit(1);
    if (!existing) return jsonError('PG not found', 404);
    if (user.role !== 'ADMIN' && !(user.role === 'MANAGER' && existing.ownerId === user.id)) {
      return jsonError('Forbidden', 403);
    }
    await db.delete(pgProperties).where(eq(pgProperties.id, id));
    return { ok: true };
  });
}
