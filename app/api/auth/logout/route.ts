import { clearSessionCookies } from '@/lib/auth';
import { handle } from '@/lib/api';

export async function POST() {
  return handle(async () => {
    await clearSessionCookies();
    return { ok: true };
  });
}
