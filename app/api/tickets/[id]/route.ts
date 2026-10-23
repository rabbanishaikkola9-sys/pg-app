import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pgProperties, supportTickets } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (!ticket) return jsonError('Ticket not found', 404);

    if (user.role === 'TENANT' && ticket.raisedBy !== user.id) return jsonError('Forbidden', 403);
    if (user.role === 'MANAGER' && ticket.pgId) {
      const [pg] = await db.select().from(pgProperties).where(eq(pgProperties.id, ticket.pgId)).limit(1);
      if (!pg || pg.ownerId !== user.id) return jsonError('Forbidden', 403);
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status !== undefined) {
      patch.status = body.status;
      if (body.status === 'RESOLVED' || body.status === 'CLOSED') patch.resolvedAt = new Date();
    }
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.assignedTo !== undefined) patch.assignedTo = body.assignedTo;

    const [updated] = await db.update(supportTickets).set(patch).where(eq(supportTickets.id, id)).returning();
    return { ticket: updated };
  });
}
