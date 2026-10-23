import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import type { DbRole } from './roles';

const SESSION_COOKIE = 'pg_session';
const ROLE_COOKIE = 'pg_role';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-production-please';
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

// ─── Password hashing (scrypt, Node built-in) ───────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(password, salt, 64);
  const target = Buffer.from(hash, 'hex');
  if (candidate.length !== target.length) return false;
  return timingSafeEqual(candidate, target);
}

// ─── Session token (HMAC-signed cookie) ─────────────────────────────
type SessionPayload = {
  userId: string;
  role: DbRole;
  iat: number;
  exp: number;
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

export function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = { ...payload, iat: now, exp: now + SESSION_MAX_AGE };
  const body = base64url(JSON.stringify(full));
  const sig = createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(fromBase64url(body).toString('utf8')) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers (Next 15+ async cookies) ────────────────────────
export async function setSessionCookies(userId: string, role: DbRole) {
  const cookieStore = await cookies();
  const token = signSession({ userId, role });
  const secure = process.env.NODE_ENV === 'production';
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  cookieStore.set(ROLE_COOKIE, role, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ROLE_COOKIE);
}

// ─── Session reading ────────────────────────────────────────────────
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: DbRole;
  phone: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;
  const rows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      role: profiles.role,
      phone: profiles.phone,
    })
    .from(profiles)
    .where(eq(profiles.id, session.userId))
    .limit(1);
  if (!rows.length) return null;
  return rows[0] as CurrentUser;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('Not authenticated', 401);
  return user;
}

export async function requireRole(...roles: DbRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError('Forbidden', 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export { SESSION_COOKIE, ROLE_COOKIE };
