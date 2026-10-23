import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pgProperties, rooms } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { isPgId } from '@/lib/pg-id';
import { sanitizeFeatureList } from '@/lib/pg-features';
import { listRoomsByPgId } from '@/lib/rooms';

const createSchema = z.object({
  roomNumber: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  capacity: z.coerce.number().int().min(1),
  currentOccupancy: z.coerce.number().int().min(0).default(0),
  hasAc: z.boolean().default(false),
  features: z.array(z.string()).default([]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  return handle(async () => {
    const { id } = await params;
    if (!isPgId(id)) return jsonError('PG not found', 404);
    const rows = await listRoomsByPgId(id);
    return { rooms: rows };
  });
}

export async function POST(req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await requireRole('ADMIN', 'MANAGER');
    const { id } = await params;
    if (!isPgId(id)) return jsonError('PG not found', 404);
    const body = createSchema.parse(await req.json());

    const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, id)).limit(1);
    if (!pg) return jsonError('PG not found', 404);
    if (user.role === 'MANAGER' && pg.ownerId !== user.id) return jsonError('Forbidden', 403);

    const [created] = await db
      .insert(rooms)
      .values({
        pgId: id,
        roomNumber: body.roomNumber,
        price: String(body.price),
        capacity: body.capacity,
        currentOccupancy: body.currentOccupancy,
        hasAc: body.hasAc,
        features: sanitizeFeatureList(body.features) as unknown as object,
      })
      .returning();

    await db
      .update(pgProperties)
      .set({ totalRooms: sql`${pgProperties.totalRooms} + 1`, updatedAt: new Date() })
      .where(eq(pgProperties.id, id));

    return { room: created };
  });
}
