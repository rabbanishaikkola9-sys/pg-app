import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { setSessionCookies, verifyPassword } from '@/lib/auth';
import { handle, jsonError } from '@/lib/api';
import { ROLE_HOME } from '@/lib/roles';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const [user] = await db
      .select({
        id: profiles.id,
        role: profiles.role,
        passwordHash: profiles.passwordHash,
      })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return jsonError('Invalid email or password.', 401);
    }

    await setSessionCookies(user.id, user.role);
    return Response.json({ ok: true, redirect: ROLE_HOME[user.role], role: user.role });
  });
}
