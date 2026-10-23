import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { pgProperties, rooms } from '@/db/schema';
import { PgImageCard } from './pg-image-card';

type GalleryRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  amenities: unknown;
  images: string[];
  totalRooms: number;
  occupiedRooms: number;
  minPrice: string | null;
  maxPrice: string | null;
};

const fallback: GalleryRow[] = [
  {
    id: 'demo-1',
    name: 'The Social Nest',
    address: '12th Main, Koramangala',
    city: 'Bangalore',
    amenities: ['WiFi', 'Meals', 'Laundry', 'Power Backup'],
    images: [],
    totalRooms: 24,
    occupiedRooms: 18,
    minPrice: '10500',
    maxPrice: '15500',
  },
  {
    id: 'demo-2',
    name: 'Urban Stay 24',
    address: 'Sector 6, HSR Layout',
    city: 'Bangalore',
    amenities: ['WiFi', 'Gym', 'AC Rooms'],
    images: [],
    totalRooms: 32,
    occupiedRooms: 27,
    minPrice: '9800',
    maxPrice: '14000',
  },
  {
    id: 'demo-3',
    name: 'Blueline PG Hub',
    address: '100ft Road, Indiranagar',
    city: 'Bangalore',
    amenities: ['Meals', 'Housekeeping', 'WiFi', 'Parking'],
    images: [],
    totalRooms: 18,
    occupiedRooms: 9,
    minPrice: '12900',
    maxPrice: '17000',
  },
  {
    id: 'demo-4',
    name: 'Minimal Living Co.',
    address: '2nd Stage, BTM Layout',
    city: 'Bangalore',
    amenities: ['WiFi', 'Single Rooms', 'Meals'],
    images: [],
    totalRooms: 20,
    occupiedRooms: 14,
    minPrice: '9200',
    maxPrice: '11800',
  },
  {
    id: 'demo-5',
    name: 'Campus Connect PG',
    address: 'Outer Ring Road, Marathahalli',
    city: 'Bangalore',
    amenities: ['Meals', 'WiFi', 'Study Rooms'],
    images: [],
    totalRooms: 28,
    occupiedRooms: 19,
    minPrice: '8600',
    maxPrice: '12300',
  },
  {
    id: 'demo-6',
    name: 'Skyline Residency',
    address: 'Phase 2, Electronic City',
    city: 'Bangalore',
    amenities: ['AC Rooms', 'Meals', 'Shuttle', 'WiFi'],
    images: [],
    totalRooms: 36,
    occupiedRooms: 24,
    minPrice: '11200',
    maxPrice: '16400',
  },
];

async function getPgs(): Promise<GalleryRow[]> {
  try {
    const result = await db
      .select({
        id: pgProperties.id,
        name: pgProperties.name,
        address: pgProperties.address,
        city: pgProperties.city,
        amenities: pgProperties.amenities,
        images: pgProperties.images,
        totalRooms: pgProperties.totalRooms,
        occupiedRooms: pgProperties.occupiedRooms,
        minPrice: sql<string | null>`MIN(${rooms.price})::text`,
        maxPrice: sql<string | null>`MAX(${rooms.price})::text`,
      })
      .from(pgProperties)
      .leftJoin(rooms, eq(rooms.pgId, pgProperties.id))
      .where(eq(pgProperties.isActive, true))
      .groupBy(
        pgProperties.id,
        pgProperties.name,
        pgProperties.address,
        pgProperties.city,
        pgProperties.amenities,
        pgProperties.images,
        pgProperties.totalRooms,
        pgProperties.occupiedRooms,
      )
      .orderBy(desc(pgProperties.createdAt))
      .limit(24);

    return result.length ? result : fallback;
  } catch {
    return fallback;
  }
}

function formatPrice(min: string | null, max: string | null): string {
  const minN = min ? Math.round(Number(min)) : 0;
  const maxN = max ? Math.round(Number(max)) : 0;
  if (!minN && !maxN) return 'Contact for price';
  if (!maxN || minN === maxN) return `₹${minN.toLocaleString('en-IN')}`;
  return `₹${minN.toLocaleString('en-IN')} – ₹${maxN.toLocaleString('en-IN')}`;
}

export async function PgGallery() {
  const pgs = await getPgs();

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {pgs.map((pg, idx) => {
        const amenities = Array.isArray(pg.amenities) ? (pg.amenities as string[]) : [];
        const roomsAvailable = Math.max(0, (pg.totalRooms ?? 0) - (pg.occupiedRooms ?? 0));
        const firstImage = Array.isArray(pg.images) && pg.images.length ? pg.images[0] : null;

        return (
          <PgImageCard
            key={pg.id}
            id={pg.id}
            name={pg.name}
            address={pg.address}
            city={pg.city}
            priceLabel={formatPrice(pg.minPrice, pg.maxPrice)}
            imageUrl={firstImage}
            roomsAvailable={pg.totalRooms ? roomsAvailable : undefined}
            totalRooms={pg.totalRooms || undefined}
            amenities={amenities}
            matchScore={Math.max(72, 95 - idx * 2)}
          />
        );
      })}
    </div>
  );
}
