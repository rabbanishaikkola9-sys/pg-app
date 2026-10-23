import { ZodError } from 'zod';
import { AuthError } from './auth';

export function jsonOk<T>(data: T, init?: number | ResponseInit) {
  return Response.json(data, typeof init === 'number' ? { status: init } : init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}

export async function handle<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const value = await fn();
    if (value instanceof Response) return value;
    return Response.json(value);
  } catch (err) {
    if (err instanceof AuthError) {
      return jsonError(err.message, err.status);
    }
    if (err instanceof ZodError) {
      return jsonError('Validation failed', 422, { issues: err.issues });
    }
    console.error('[api] unhandled', err);
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return jsonError(message, 500);
  }
}
