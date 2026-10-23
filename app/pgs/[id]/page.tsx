import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  Home,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedSection } from '@/components/ui/animated-section';
import { BookingCta } from '@/components/landing/booking-cta';
import { PgImageGallery } from '@/components/landing/pg-image-gallery';
import { db } from '@/db';
import { pgProperties, profiles } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeImageUrls } from '@/lib/images';
import { asStringList } from '@/lib/pg-features';
import { isPgId } from '@/lib/pg-id';
import { listRoomsByPgId } from '@/lib/rooms';

type PageProps = { params: Promise<{ id: string }> };

const gradients = [
  'from-blue-500 via-indigo-500 to-purple-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-fuchsia-500 via-rose-500 to-orange-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
];

function pickGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return gradients[Math.abs(hash) % gradients.length];
}

export default async function PublicPgDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isPgId(id)) notFound();

  const [row] = await db
    .select({
      pg: pgProperties,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
      ownerPhone: profiles.phone,
    })
    .from(pgProperties)
    .leftJoin(profiles, eq(profiles.id, pgProperties.ownerId))
    .where(eq(pgProperties.id, id))
    .limit(1);

  if (!row || !row.pg.isActive) notFound();

  const pg = row.pg;
  const roomRows = await listRoomsByPgId(id);
  const user = await getCurrentUser();

  const amenities = asStringList(pg.amenities);
  const images = sanitizeImageUrls(pg.images);
  const gradient = pickGradient(pg.id);

  const totalRooms = pg.totalRooms || 0;
  const occupied = pg.occupiedRooms || 0;
  const available = Math.max(0, totalRooms - occupied);
  const occupancyPct = totalRooms > 0 ? Math.min(100, Math.round((occupied / totalRooms) * 100)) : 0;
  const roomPrices = roomRows.map((r) => Number(r.price)).filter((n) => n > 0);
  const minRoomPrice = roomPrices.length ? Math.min(...roomPrices) : null;
  const maxRoomPrice = roomPrices.length ? Math.max(...roomPrices) : null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-28 md:px-8 md:pt-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              className="group rounded-xl text-zinc-600 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="mr-1 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to all PGs
            </Button>
          </Link>
          {!user ? (
            <div className="flex gap-2">
              <Link href={`/login?next=/pgs/${id}`}>
                <Button variant="ghost" className="rounded-xl">
                  Login
                </Button>
              </Link>
              <Link href={`/signup?next=/pgs/${id}`}>
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700">Sign Up</Button>
              </Link>
            </div>
          ) : null}
        </div>

        <AnimatedSection className="space-y-3" delay={0}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/20">
              <ShieldCheck className="h-3 w-3" /> Verified PG
            </Badge>
            {available > 0 ? (
              <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
                <Sparkles className="h-3 w-3" /> {available} rooms available
              </Badge>
            ) : (
              <Badge variant="outline">Fully occupied</Badge>
            )}
          </div>
          <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">{pg.name}</h1>
          <p className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
            <MapPin className="h-4 w-4" />
            {pg.address}
            {pg.city ? `, ${pg.city}` : ''}
            {pg.state ? `, ${pg.state}` : ''}
            {pg.pincode ? ` ${pg.pincode}` : ''}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.05}>
          <PgImageGallery images={images} name={pg.name} fallbackGradient={gradient} />
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-3">
          <AnimatedSection className="space-y-6 md:col-span-2" delay={0.1} as="div">
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-blue-500" /> About this PG
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-zinc-600 leading-relaxed dark:text-zinc-300">
                  {pg.description ||
                    'A verified PG ready for move-in. Reach out to the owner directly or send a booking request below to lock your room.'}
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile label="Total rooms" value={String(totalRooms)} icon={<BedDouble className="h-4 w-4" />} />
                  <StatTile
                    label="Available"
                    value={`${available}`}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    accent="text-emerald-600 dark:text-emerald-400"
                  />
                  <StatTile label="Occupancy" value={`${occupancyPct}%`} icon={<Building2 className="h-4 w-4" />} />
                </div>

                <div>
                  <p className="font-medium text-sm">Occupancy</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {occupied} of {totalRooms} rooms occupied
                  </p>
                </div>

                {amenities.length ? (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((a) => (
                        <Badge
                          key={a}
                          variant="outline"
                          className="rounded-full border-zinc-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BedDouble className="h-5 w-5 text-blue-500" /> Available Rooms & Vacancies
                </CardTitle>
                <CardDescription>Pick a room and send a booking request to the owner.</CardDescription>
              </CardHeader>
              <CardContent>
                {roomRows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No rooms listed yet — try again soon.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roomRows.map((r) => {
                      const cap = r.capacity || 0;
                      const occ = r.currentOccupancy || 0;
                      const vacancies = Math.max(0, cap - occ);
                      const isAvailable = vacancies > 0;
                      return (
                        <div
                          key={r.id}
                          className="group rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-blue-500/10 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400/40"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">Room {r.roomNumber}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {occ}/{cap} occupied · {vacancies} vacancies
                              </p>
                            </div>
                            <Badge
                              className={
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/20'
                                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'
                              }
                            >
                              {isAvailable ? 'Available' : 'Full'}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-end justify-between gap-2">
                            <div>
                              <p className="font-semibold text-xl">
                                ₹{Number(r.price).toLocaleString('en-IN')}
                                <span className="ml-1 font-normal text-xs text-zinc-500 dark:text-zinc-400">
                                  /month
                                </span>
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {r.hasAc ? (
                                  <Badge variant="outline" className="text-xs">
                                    AC
                                  </Badge>
                                ) : null}
                                {asStringList(r.features).map((feature) => (
                                  <Badge key={feature} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <BookingCta
                              pgId={pg.id}
                              roomId={r.id}
                              roomNumber={r.roomNumber}
                              available={isAvailable}
                              isAuthenticated={Boolean(user)}
                              canBook={user?.role === 'TENANT'}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection className="space-y-4" delay={0.15} as="div">
            <Card className="sticky top-6 rounded-2xl border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
                <CardDescription>Live rates from this property.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-3xl tracking-tight">
                    {minRoomPrice == null
                      ? 'Contact for price'
                      : maxRoomPrice && maxRoomPrice !== minRoomPrice
                        ? `₹${minRoomPrice.toLocaleString('en-IN')} – ₹${maxRoomPrice.toLocaleString('en-IN')}`
                        : `₹${minRoomPrice.toLocaleString('en-IN')}`}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">per month, all-inclusive options below</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 0% brokerage on bookings
                  </li>
                  <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Verified property & owner
                  </li>
                  <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Chat with owner inside the app
                  </li>
                </ul>
                {!user ? (
                  <Link href={`/signup?next=/pgs/${id}`} className="block">
                    <Button className="w-full rounded-xl bg-blue-600 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-500/30 hover:shadow-lg">
                      Sign up free to book
                    </Button>
                  </Link>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Owner</CardTitle>
                <CardDescription>Contact the PG manager directly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{row.ownerName ?? 'Owner'}</p>
                {user ? (
                  <>
                    {row.ownerEmail ? (
                      <p className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                        <Mail className="h-3.5 w-3.5" /> {row.ownerEmail}
                      </p>
                    ) : null}
                    {row.ownerPhone ? (
                      <p className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                        <Phone className="h-3.5 w-3.5" /> {row.ownerPhone}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    <Link href={`/signup?next=/pgs/${id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                      Sign up
                    </Link>{' '}
                    to see owner contact details.
                  </p>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-blue-500/10 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400/40">
      <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        {icon} {label}
      </div>
      <p className={`mt-1 font-semibold text-xl ${accent ?? ''}`}>{value}</p>
    </div>
  );
}
