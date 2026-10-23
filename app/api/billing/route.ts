import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { billing, pgProperties, profiles, rooms, tenants } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

const createSchema = z.object({
  tenantId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  dueDate: z.string().min(8),
});

export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    const baseConds = [] as ReturnType<typeof eq>[];
    if (user.role === 'TENANT') {
      const myTenant = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.userId, user.id));
      const ids = myTenant.map((t) => t.id);
      if (!ids.length) return { invoices: [] };
      baseConds.push(inArray(billing.tenantId, ids));
    } else if (user.role === 'MANAGER') {
      const myPgs = await db
        .select({ id: pgProperties.id })
        .from(pgProperties)
        .where(eq(pgProperties.ownerId, user.id));
      if (!myPgs.length) return { invoices: [] };
      const myTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(
          inArray(
            tenants.pgId,
            myPgs.map((p) => p.id),
          ),
        );
      if (!myTenants.length) return { invoices: [] };
      baseConds.push(
        inArray(
          billing.tenantId,
          myTenants.map((t) => t.id),
        ),
      );
    }

    const rows = await db
      .select({
        id: billing.id,
        amount: billing.amount,
        dueDate: billing.dueDate,
        status: billing.status,
        paidAt: billing.paidAt,
        createdAt: billing.createdAt,
        tenantId: billing.tenantId,
        renterName: profiles.fullName,
        pgName: pgProperties.name,
        roomNumber: rooms.roomNumber,
      })
      .from(billing)
      .leftJoin(tenants, eq(tenants.id, billing.tenantId))
      .leftJoin(profiles, eq(profiles.id, tenants.userId))
      .leftJoin(pgProperties, eq(pgProperties.id, tenants.pgId))
      .leftJoin(rooms, eq(rooms.id, tenants.roomId))
      .where(baseConds.length ? and(...baseConds) : undefined)
      .orderBy(desc(billing.dueDate))
      .limit(500);

    return { invoices: rows };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') return jsonError('Forbidden', 403);
    const body = createSchema.parse(await req.json());

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, body.tenantId)).limit(1);
    if (!tenant) return jsonError('Tenant not found', 404);

    if (user.role === 'MANAGER') {
      const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, tenant.pgId)).limit(1);
      if (!pg || pg.ownerId !== user.id) return jsonError('Forbidden', 403);
    }

    const [created] = await db
      .insert(billing)
      .values({
        tenantId: body.tenantId,
        amount: String(body.amount),
        dueDate: body.dueDate,
      })
      .returning();
    return { invoice: created };
  });
}
