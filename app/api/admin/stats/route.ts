import { count, eq, sum } from 'drizzle-orm';
import { db } from '@/db';
import { billing, pgProperties, profiles, supportTickets, tenants } from '@/db/schema';
import { handle } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export async function GET() {
  return handle(async () => {
    await requireRole('ADMIN');

    const [pgs] = await db.select({ value: count() }).from(pgProperties);
    const [active] = await db.select({ value: count() }).from(pgProperties).where(eq(pgProperties.isActive, true));
    const [renters] = await db.select({ value: count() }).from(tenants);
    const [owners] = await db.select({ value: count() }).from(profiles).where(eq(profiles.role, 'MANAGER'));
    const [openTickets] = await db
      .select({ value: count() })
      .from(supportTickets)
      .where(eq(supportTickets.status, 'OPEN'));

    const [pending] = await db
      .select({ value: sum(billing.amount) })
      .from(billing)
      .where(eq(billing.status, 'PENDING'));
    const [paid] = await db
      .select({ value: sum(billing.amount) })
      .from(billing)
      .where(eq(billing.status, 'PAID'));

    return {
      totalPgs: pgs.value,
      activePgs: active.value,
      activeRenters: renters.value,
      totalOwners: owners.value,
      openTickets: openTickets.value,
      pendingDues: Number(pending.value ?? 0),
      monthlyRevenue: Number(paid.value ?? 0),
    };
  });
}
