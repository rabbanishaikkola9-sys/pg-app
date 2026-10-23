import { isPgId } from './pg-id';

export function readPgIdParam(id: unknown): string | null {
  if (typeof id === 'string') {
    const trimmed = id.trim();
    return isPgId(trimmed) ? trimmed : null;
  }
  if (Array.isArray(id) && typeof id[0] === 'string') {
    const trimmed = id[0].trim();
    return isPgId(trimmed) ? trimmed : null;
  }
  return null;
}

export function pgDetailFromResponse(
  ok: boolean,
  data: { pg?: unknown; rooms?: unknown; owner?: unknown; error?: unknown },
) {
  const error = typeof data.error === 'string' && data.error.trim() ? data.error : null;
  if (!ok || data.pg == null || typeof data.pg !== 'object') {
    return { ok: false as const, error: error ?? 'PG not found.' };
  }
  return {
    ok: true as const,
    pg: data.pg,
    rooms: Array.isArray(data.rooms) ? data.rooms : [],
    owner: data.owner && typeof data.owner === 'object' ? data.owner : null,
  };
}
