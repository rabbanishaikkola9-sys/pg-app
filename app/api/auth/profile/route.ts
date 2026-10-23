import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

const bodySchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
});

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();

    if (email !== user.email) {
      const existing = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(and(eq(profiles.email, email), ne(profiles.id, user.id)))
        .limit(1);
      if (existing.length) {
        return jsonError('Email is already in use.', 409);
      }
    }

    const [updated] = await db
      .update(profiles)
      .set({ fullName: body.fullName, email, phone: body.phone })
      .where(eq(profiles.id, user.id))
      .returning({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        role: profiles.role,
        phone: profiles.phone,
      });

    return { user: updated };
  });
}
