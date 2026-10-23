import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { hashPassword, setSessionCookies } from '@/lib/auth';
import { handle, jsonError } from '@/lib/api';
import { ROLE_HOME, signupRoleToDb } from '@/lib/roles';

const bodySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['STUDENT_PROFESSIONAL', 'PG_OWNER']),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email)).limit(1);

    if (existing.length) {
      return jsonError('An account with this email already exists.', 409);
    }

    const role = signupRoleToDb(body.role);
    const [created] = await db
      .insert(profiles)
      .values({
        fullName: body.fullName,
        email,
        passwordHash: hashPassword(body.password),
        role,
        phone: body.phone ?? null,
      })
      .returning({ id: profiles.id, role: profiles.role });

    await setSessionCookies(created.id, created.role);
    return Response.json({ ok: true, redirect: ROLE_HOME[created.role] });
  });
}
