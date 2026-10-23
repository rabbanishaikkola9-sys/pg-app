import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { pgProperties, profiles, rooms, tenants } from '@/db/schema';
import { handle } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export async function GET() {
  return handle(async () => {
    const user = await requireRole('ADMIN', 'MANAGER');

    const baseConds = [] as ReturnType<typeof eq>[];
    if (user.role === 'MANAGER') {
      const myPgs = await db
        .select({ id: pgProperties.id })
        .from(pgProperties)
        .where(eq(pgProperties.ownerId, user.id));
      const ids = myPgs.map((p) => p.id);
      if (!ids.length) return { tenants: [] };
      baseConds.push(inArray(tenants.pgId, ids));
    }

    const rows = await db
      .select({
        id: tenants.id,
        rentStatus: tenants.rentStatus,
        lastPaymentDate: tenants.lastPaymentDate,
        joinedAt: tenants.joinedAt,
        userId: tenants.userId,
        userName: profiles.fullName,
        userEmail: profiles.email,
        userPhone: profiles.phone,
        pgId: tenants.pgId,
        pgName: pgProperties.name,
        roomId: tenants.roomId,
        roomNumber: rooms.roomNumber,
        roomPrice: rooms.price,
      })
      .from(tenants)
      .leftJoin(profiles, eq(profiles.id, tenants.userId))
      .leftJoin(pgProperties, eq(pgProperties.id, tenants.pgId))
      .leftJoin(rooms, eq(rooms.id, tenants.roomId))
      .where(baseConds.length ? and(...baseConds) : undefined)
      .limit(8000);

    return { tenants: rows };
  });
}
