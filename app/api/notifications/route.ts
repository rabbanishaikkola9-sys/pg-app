import { desc, eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { handle } from '@/lib/api';
import { requireRole, requireUser } from '@/lib/auth';

const createSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  channel: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']).default('IN_APP'),
  targetRole: z.enum(['ADMIN', 'MANAGER', 'TENANT']).optional(),
  targetUserId: z.string().uuid().optional(),
  isGlobal: z.boolean().default(false),
});

export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    const rows = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        channel: notifications.channel,
        isGlobal: notifications.isGlobal,
        targetRole: notifications.targetRole,
        sentAt: notifications.sentAt,
        readAt: notifications.readAt,
      })
      .from(notifications)
      .where(
        or(
          eq(notifications.isGlobal, true),
          eq(notifications.targetUserId, user.id),
          eq(notifications.targetRole, user.role),
        ),
      )
      .orderBy(desc(notifications.sentAt))
      .limit(100);

    return { notifications: rows };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireRole('ADMIN', 'MANAGER');
    const body = createSchema.parse(await req.json());

    const [created] = await db
      .insert(notifications)
      .values({
        title: body.title,
        message: body.message,
        channel: body.channel,
        targetRole: body.targetRole ?? null,
        targetUserId: body.targetUserId ?? null,
        isGlobal: body.isGlobal,
        createdBy: user.id,
      })
      .returning();

    return { notification: created };
  });
}
