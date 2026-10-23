import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pgProperties, profiles, supportTickets } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

const createSchema = z.object({
  subject: z.string().min(3),
  description: z.string().min(3),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  pgId: z.string().uuid().optional(),
});

export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    const conditions = [] as ReturnType<typeof eq>[];
    if (user.role === 'TENANT') {
      conditions.push(eq(supportTickets.raisedBy, user.id));
    } else if (user.role === 'MANAGER') {
      const myPgs = await db
        .select({ id: pgProperties.id })
        .from(pgProperties)
        .where(eq(pgProperties.ownerId, user.id));
      const ids = myPgs.map((p) => p.id);
      if (!ids.length) return { tickets: [] };
      conditions.push(inArray(supportTickets.pgId, ids));
    }

    const rows = await db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        raisedBy: supportTickets.raisedBy,
        raisedByName: profiles.fullName,
        pgId: supportTickets.pgId,
        pgName: pgProperties.name,
      })
      .from(supportTickets)
      .leftJoin(profiles, eq(profiles.id, supportTickets.raisedBy))
      .leftJoin(pgProperties, eq(pgProperties.id, supportTickets.pgId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(supportTickets.createdAt))
      .limit(200);

    return { tickets: rows };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());

    if (body.pgId) {
      const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, body.pgId)).limit(1);
      if (!pg) return jsonError('PG not found', 404);
    }

    const [created] = await db
      .insert(supportTickets)
      .values({
        subject: body.subject,
        description: body.description,
        priority: body.priority,
        raisedBy: user.id,
        pgId: body.pgId ?? null,
      })
      .returning();
    return { ticket: created };
  });
}
