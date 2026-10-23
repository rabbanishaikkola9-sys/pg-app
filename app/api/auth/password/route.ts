import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { hashPassword, requireUser, verifyPassword } from '@/lib/auth';

const bodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = bodySchema.parse(await req.json());

    const [row] = await db
      .select({ passwordHash: profiles.passwordHash })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!row || !verifyPassword(body.currentPassword, row.passwordHash)) {
      return jsonError('Current password is incorrect.', 401);
    }

    if (body.newPassword === body.currentPassword) {
      return jsonError('New password must be different from current password.', 400);
    }

    await db
      .update(profiles)
      .set({ passwordHash: hashPassword(body.newPassword) })
      .where(eq(profiles.id, user.id));

    return { ok: true };
  });
}
