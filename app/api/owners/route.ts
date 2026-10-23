import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pgProperties, profiles } from '@/db/schema';
import { handle, jsonError } from '@/lib/api';
import { hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/auth';

const createSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
});

export async function GET(req: Request) {
  return handle(async () => {
    await requireRole('ADMIN');
    const url = new URL(req.url);
    const search = url.searchParams.get('q')?.trim();

    const conditions = [eq(profiles.role, 'MANAGER' as const)];
    if (search) {
      const matchSearch = or(ilike(profiles.fullName, `%${search}%`), ilike(profiles.email, `%${search}%`));
      if (matchSearch) conditions.push(matchSearch);
    }

    const rows = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        phone: profiles.phone,
        createdAt: profiles.createdAt,
        pgCount: sql<number>`(SELECT COUNT(*) FROM ${pgProperties} WHERE ${pgProperties.ownerId} = ${profiles.id})`,
        roomCount: sql<number>`(SELECT COALESCE(SUM(${pgProperties.totalRooms}), 0) FROM ${pgProperties} WHERE ${pgProperties.ownerId} = ${profiles.id})`,
      })
      .from(profiles)
      .where(and(...conditions))
      .orderBy(desc(profiles.createdAt))
      .limit(200);

    return { owners: rows };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireRole('ADMIN');
    const body = createSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email)).limit(1);
    if (existing.length) return jsonError('Owner with this email already exists.', 409);

    const passwordHash = body.password ? hashPassword(body.password) : null;
    const [created] = await db
      .insert(profiles)
      .values({
        fullName: body.fullName,
        email,
        phone: body.phone ?? null,
        role: 'MANAGER',
        passwordHash,
      })
      .returning({ id: profiles.id, fullName: profiles.fullName, email: profiles.email });

    return { owner: created };
  });
}
