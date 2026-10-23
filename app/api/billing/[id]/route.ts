import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { billing, pgProperties, tenants } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

// Mark invoice paid
export async function PUT(_req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const [invoice] = await db.select().from(billing).where(eq(billing.id, id)).limit(1);
    if (!invoice) return jsonError('Invoice not found', 404);

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, invoice.tenantId)).limit(1);
    if (!tenant) return jsonError('Tenant not found', 404);

    if (user.role === 'TENANT' && tenant.userId !== user.id) return jsonError('Forbidden', 403);
    if (user.role === 'MANAGER') {
      const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, tenant.pgId)).limit(1);
      if (!pg || pg.ownerId !== user.id) return jsonError('Forbidden', 403);
    }

    const now = new Date();
    const [updated] = await db
      .update(billing)
      .set({ status: 'PAID', paidAt: now })
      .where(eq(billing.id, id))
      .returning();

    await db
      .update(tenants)
      .set({ rentStatus: 'PAID', lastPaymentDate: now.toISOString().slice(0, 10) })
      .where(eq(tenants.id, invoice.tenantId));

    return { invoice: updated };
  });
}
