import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bookings, pgProperties, rooms, tenants } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

const updateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT']),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const { status } = updateSchema.parse(await req.json());

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) return jsonError('Booking not found', 404);

    if (user.role === 'TENANT') {
      if (booking.renterId !== user.id) return jsonError('Forbidden', 403);
      if (status !== 'CANCELLED') return jsonError('Renters may only cancel.', 403);
    } else if (user.role === 'MANAGER') {
      const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, booking.pgId)).limit(1);
      if (!pg || pg.ownerId !== user.id) return jsonError('Forbidden', 403);
    } else if (user.role !== 'ADMIN') {
      return jsonError('Forbidden', 403);
    }

    const [updated] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();

    // Side effects on approval/checkin
    if (status === 'APPROVED' || status === 'CHECKED_IN') {
      const [existingTenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.userId, booking.renterId))
        .limit(1);

      if (!existingTenant) {
        await db.insert(tenants).values({
          userId: booking.renterId,
          pgId: booking.pgId,
          roomId: booking.roomId,
          rentStatus: 'PENDING',
        });
        await db
          .update(rooms)
          .set({ currentOccupancy: sql`LEAST(${rooms.capacity}, ${rooms.currentOccupancy} + 1)` })
          .where(eq(rooms.id, booking.roomId));
        await db
          .update(pgProperties)
          .set({ occupiedRooms: sql`${pgProperties.occupiedRooms} + 1`, updatedAt: new Date() })
          .where(eq(pgProperties.id, booking.pgId));
      }
    }

    return { booking: updated };
  });
}
