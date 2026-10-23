import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pgProperties, rooms } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { sanitizeFeatureList } from '@/lib/pg-features';

const updateSchema = z.object({
  roomNumber: z.string().min(1).optional(),
  price: z.coerce.number().nonnegative().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  currentOccupancy: z.coerce.number().int().min(0).optional(),
  hasAc: z.boolean().optional(),
  features: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await requireRole('ADMIN', 'MANAGER');
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    if (!room) return jsonError('Room not found', 404);

    if (user.role === 'MANAGER') {
      const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, room.pgId)).limit(1);
      if (!pg || pg.ownerId !== user.id) return jsonError('Forbidden', 403);
    }

    const patch: Record<string, unknown> = {};
    if (body.roomNumber !== undefined) patch.roomNumber = body.roomNumber;
    if (body.price !== undefined) patch.price = String(body.price);
    if (body.capacity !== undefined) patch.capacity = body.capacity;
    if (body.currentOccupancy !== undefined) patch.currentOccupancy = body.currentOccupancy;
    if (body.hasAc !== undefined) patch.hasAc = body.hasAc;
    if (body.features !== undefined) patch.features = sanitizeFeatureList(body.features);

    const [updated] = await db.update(rooms).set(patch).where(eq(rooms.id, id)).returning();
    return { room: updated };
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await requireRole('ADMIN', 'MANAGER');
    const { id } = await params;
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    if (!room) return jsonError('Room not found', 404);

    if (user.role === 'MANAGER') {
      const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, room.pgId)).limit(1);
      if (!pg || pg.ownerId !== user.id) return jsonError('Forbidden', 403);
    }

    await db.delete(rooms).where(eq(rooms.id, id));
    await db
      .update(pgProperties)
      .set({ totalRooms: sql`GREATEST(0, ${pgProperties.totalRooms} - 1)`, updatedAt: new Date() })
      .where(eq(pgProperties.id, room.pgId));
    return { ok: true };
  });
}
