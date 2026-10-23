import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bookings, pgProperties, profiles, rooms } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

const createSchema = z.object({
  pgId: z.string().uuid(),
  roomId: z.string().uuid(),
  moveInDate: z.string().min(8),
  message: z.string().optional(),
});

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');

    const baseConds = [] as ReturnType<typeof eq>[];
    if (user.role === 'TENANT') baseConds.push(eq(bookings.renterId, user.id));
    if (statusFilter) baseConds.push(eq(bookings.status, statusFilter as 'PENDING'));

    if (user.role === 'MANAGER') {
      const myPgs = await db
        .select({ id: pgProperties.id })
        .from(pgProperties)
        .where(eq(pgProperties.ownerId, user.id));
      const ids = myPgs.map((p) => p.id);
      if (!ids.length) return { bookings: [] };
      baseConds.push(inArray(bookings.pgId, ids));
    }

    const rows = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        moveInDate: bookings.moveInDate,
        message: bookings.message,
        createdAt: bookings.createdAt,
        pgId: bookings.pgId,
        pgName: pgProperties.name,
        address: pgProperties.address,
        roomId: bookings.roomId,
        roomNumber: rooms.roomNumber,
        roomPrice: rooms.price,
        renterId: bookings.renterId,
        renterName: profiles.fullName,
        renterEmail: profiles.email,
      })
      .from(bookings)
      .leftJoin(pgProperties, eq(pgProperties.id, bookings.pgId))
      .leftJoin(rooms, eq(rooms.id, bookings.roomId))
      .leftJoin(profiles, eq(profiles.id, bookings.renterId))
      .where(baseConds.length ? and(...baseConds) : undefined)
      .orderBy(desc(bookings.createdAt))
      .limit(200);

    return { bookings: rows };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (user.role !== 'TENANT') return jsonError('Only renters can book.', 403);
    const body = createSchema.parse(await req.json());

    const [room] = await db.select().from(rooms).where(eq(rooms.id, body.roomId)).limit(1);
    if (!room) return jsonError('Room not found', 404);
    if (room.pgId !== body.pgId) return jsonError('Room does not belong to this PG.', 400);
    if (room.currentOccupancy >= room.capacity) return jsonError('Room is at full capacity.', 409);

    const [created] = await db
      .insert(bookings)
      .values({
        renterId: user.id,
        pgId: body.pgId,
        roomId: body.roomId,
        moveInDate: body.moveInDate,
        message: body.message ?? null,
      })
      .returning();

    return { booking: created };
  });
}
