import { and, count, eq, inArray, sum } from 'drizzle-orm';
import { db } from '@/db';
import { billing, bookings, pgProperties, rooms, tenants } from '@/db/schema';
import { handle } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export async function GET() {
  return handle(async () => {
    const user = await requireRole('TENANT');

    const myTenants = await db
      .select({
        id: tenants.id,
        rentStatus: tenants.rentStatus,
        joinedAt: tenants.joinedAt,
        pgId: tenants.pgId,
        pgName: pgProperties.name,
        roomNumber: rooms.roomNumber,
        roomPrice: rooms.price,
      })
      .from(tenants)
      .leftJoin(pgProperties, eq(pgProperties.id, tenants.pgId))
      .leftJoin(rooms, eq(rooms.id, tenants.roomId))
      .where(eq(tenants.userId, user.id));

    const tenantIds = myTenants.map((t) => t.id);

    let pendingDues = 0;
    let openInvoices = 0;
    if (tenantIds.length) {
      const [duesRow] = await db
        .select({ value: sum(billing.amount) })
        .from(billing)
        .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PENDING')));
      const [openRow] = await db
        .select({ value: count() })
        .from(billing)
        .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PENDING')));
      pendingDues = Number(duesRow.value ?? 0);
      openInvoices = openRow.value;
    }

    const [pendingBooking] = await db
      .select({ value: count() })
      .from(bookings)
      .where(and(eq(bookings.renterId, user.id), eq(bookings.status, 'PENDING')));

    return {
      activeTenancy: myTenants[0] ?? null,
      pendingDues,
      openInvoices,
      pendingBookings: pendingBooking.value,
    };
  });
}
