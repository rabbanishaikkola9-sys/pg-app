import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { rooms } from '@/db/schema';

const coreRoomColumns = {
  id: rooms.id,
  pgId: rooms.pgId,
  roomNumber: rooms.roomNumber,
  price: rooms.price,
  capacity: rooms.capacity,
  currentOccupancy: rooms.currentOccupancy,
};

export type RoomRow = {
  id: string;
  pgId: string;
  roomNumber: string;
  price: string;
  capacity: number;
  currentOccupancy: number;
  hasAc?: boolean;
  features?: unknown;
};

export async function listRoomsByPgId(pgId: string): Promise<RoomRow[]> {
  try {
    return await db.select().from(rooms).where(eq(rooms.pgId, pgId)).orderBy(asc(rooms.roomNumber));
  } catch (error) {
    console.error('[rooms] full select failed, retrying without AC/features columns', error);
    try {
      const rows = await db
        .select(coreRoomColumns)
        .from(rooms)
        .where(eq(rooms.pgId, pgId))
        .orderBy(asc(rooms.roomNumber));
      return rows.map((row) => ({ ...row, hasAc: false, features: [] }));
    } catch (fallbackError) {
      console.error('[rooms] core select failed, returning no rooms', fallbackError);
      return [];
    }
  }
}

export async function listRoomFeatureSourcesByPgIds(pgIds: string[]) {
  if (pgIds.length === 0) return [];
  try {
    return await db
      .select({
        pgId: rooms.pgId,
        hasAc: rooms.hasAc,
        features: rooms.features,
      })
      .from(rooms)
      .where(inArray(rooms.pgId, pgIds));
  } catch (error) {
    console.error('[rooms] feature columns unavailable, using PG amenities only', error);
    return [];
  }
}
