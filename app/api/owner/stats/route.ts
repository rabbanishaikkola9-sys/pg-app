import { and, count, eq, inArray, sum } from 'drizzle-orm';
import { db } from '@/db';
import { billing, bookings, pgProperties, tenants } from '@/db/schema';
import { handle } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export async function GET() {
  return handle(async () => {
    const user = await requireRole('MANAGER');

    const myPgs = await db.select({ id: pgProperties.id }).from(pgProperties).where(eq(pgProperties.ownerId, user.id));
    const pgIds = myPgs.map((p) => p.id);

    if (!pgIds.length) {
      return { totalPgs: 0, activeTenants: 0, pendingBookings: 0, monthlyRevenue: 0, pendingDues: 0 };
    }

    const [tenantCount] = await db.select({ value: count() }).from(tenants).where(inArray(tenants.pgId, pgIds));
    const [pending] = await db
      .select({ value: count() })
      .from(bookings)
      .where(and(inArray(bookings.pgId, pgIds), eq(bookings.status, 'PENDING')));

    const myTenants = await db.select({ id: tenants.id }).from(tenants).where(inArray(tenants.pgId, pgIds));
    const tenantIds = myTenants.map((t) => t.id);

    let pendingDues = 0;
    let paidSum = 0;
    if (tenantIds.length) {
      const [duesRow] = await db
        .select({ value: sum(billing.amount) })
        .from(billing)
        .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PENDING')));
      const [paidRow] = await db
        .select({ value: sum(billing.amount) })
        .from(billing)
        .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PAID')));
      pendingDues = Number(duesRow.value ?? 0);
      paidSum = Number(paidRow.value ?? 0);
    }

    return {
      totalPgs: pgIds.length,
      activeTenants: tenantCount.value,
      pendingBookings: pending.value,
      monthlyRevenue: paidSum,
      pendingDues,
    };
  });
}
