import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, client } from './index';
import { pgProperties, profiles, rooms } from './schema';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? 'password123';

const seedUsers = [
  {
    fullName: process.env.DEFAULT_ADMIN_NAME ?? 'Platform Admin',
    email: process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@pgapp.local',
    phone: process.env.DEFAULT_ADMIN_PHONE ?? '+10000000000',
    role: 'ADMIN' as const,
  },
  {
    fullName: 'Aarav Mehta',
    email: 'owner@pgapp.local',
    phone: '+919876543210',
    role: 'MANAGER' as const,
  },
  {
    fullName: 'Riya Sharma',
    email: 'renter@pgapp.local',
    phone: '+919812345678',
    role: 'TENANT' as const,
  },
];

async function ensureUser(user: (typeof seedUsers)[number]) {
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, user.email)).limit(1);
  if (existing.length) {
    return existing[0].id;
  }
  const [created] = await db
    .insert(profiles)
    .values({ ...user, passwordHash: hashPassword(DEFAULT_PASSWORD) })
    .returning({ id: profiles.id });
  console.info(`Created ${user.role} user: ${user.email} (password: ${DEFAULT_PASSWORD})`);
  return created.id;
}

async function seedSamplePg(ownerId: string) {
  const existing = await db
    .select({ id: pgProperties.id })
    .from(pgProperties)
    .where(eq(pgProperties.ownerId, ownerId))
    .limit(1);
  if (existing.length) return;

  const [pg] = await db
    .insert(pgProperties)
    .values({
      ownerId,
      name: 'Sunrise Nest PG',
      description: 'A cozy PG in the heart of Koramangala with all modern amenities.',
      address: '123, 5th Block',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560095',
      amenities: ['Wi-Fi', 'AC', 'Laundry', 'Parking', 'Power Backup', 'Mess / Food'] as unknown as object,
      totalRooms: 3,
      rentRangeMin: '7500.00',
      rentRangeMax: '12000.00',
    })
    .returning();

  await db.insert(rooms).values([
    {
      pgId: pg.id,
      roomNumber: '101',
      price: '7500.00',
      capacity: 2,
      hasAc: true,
      features: ['Wi-Fi', 'Laundry'] as unknown as object,
    },
    {
      pgId: pg.id,
      roomNumber: '102',
      price: '9500.00',
      capacity: 1,
      hasAc: true,
      features: ['Wi-Fi', 'Hot Water'] as unknown as object,
    },
    {
      pgId: pg.id,
      roomNumber: '103',
      price: '12000.00',
      capacity: 1,
      hasAc: false,
      features: ['Study Rooms'] as unknown as object,
    },
  ]);

  console.info('Seeded sample PG: Sunrise Nest PG with 3 rooms');
}

async function run() {
  await ensureUser(seedUsers[0]);
  const ownerId = await ensureUser(seedUsers[1]);
  await ensureUser(seedUsers[2]);
  await seedSamplePg(ownerId);
}

run()
  .catch((error) => {
    console.error('Failed to seed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
