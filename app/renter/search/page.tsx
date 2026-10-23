'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, MapPin, Search as SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PgCardCover } from '@/components/images/pg-card-cover';
import { FeatureCheckboxList } from '@/components/pg/feature-checkbox-list';
import { detectCurrentCity } from '@/lib/current-location';
import { firstImageUrl } from '@/lib/images';
import { asStringList } from '@/lib/pg-features';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const CITY_SESSION_KEY = 'pg:search-city';

type Pg = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  amenities: unknown;
  images?: string[];
  totalRooms: number;
  occupiedRooms: number;
  rentRangeMin: string | null;
  rentRangeMax: string | null;
  isActive: boolean;
};

export default function RenterSearchPage() {
  const [pgs, setPgs] = useState<Pg[]>([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  const fetchPgs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ active: 'true' });
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (features.length) params.set('features', features.join(','));
    const res = await fetch(`/api/pgs?${params.toString()}`);
    const data = await res.json();
    setPgs(data.pgs ?? []);
    setLoading(false);
  }, [q, city, minPrice, maxPrice, features]);

  useEffect(() => {
    fetchPgs();
  }, [fetchPgs]);

  const applyCity = useCallback((next: string, fromLocation: boolean) => {
    setCity(next);
    setUsingCurrentLocation(fromLocation);
    if (typeof window !== 'undefined') {
      if (next) window.sessionStorage.setItem(CITY_SESSION_KEY, next);
      else window.sessionStorage.removeItem(CITY_SESSION_KEY);
    }
  }, []);

  const trackCurrentLocation = useCallback(
    async (announce: boolean) => {
      setLocating(true);
      try {
        const next = await detectCurrentCity();
        applyCity(next, true);
        if (announce) toast.success(`Searching PGs near ${next}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not read your current location.';
        if (announce) toast.error(message);
      } finally {
        setLocating(false);
      }
    },
    [applyCity],
  );

  const trackedLocation = useRef(false);
  useEffect(() => {
    if (trackedLocation.current) return;
    trackedLocation.current = true;
    const saved = window.sessionStorage.getItem(CITY_SESSION_KEY);
    if (saved) {
      applyCity(saved, true);
      return;
    }
    void trackCurrentLocation(false);
  }, [applyCity, trackCurrentLocation]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPgs();
  };

  const visible = useMemo(() => pgs.filter((p) => p.isActive), [pgs]);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Find Your PG</h1>
        <p className="text-muted-foreground text-sm">
          Search by current location, price, and the features listed on PGs and rooms.
        </p>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardContent className="pt-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="relative sm:col-span-2">
                <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="rounded-xl pl-9"
                  placeholder="Search by name or address"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="rounded-xl pr-10 pl-9"
                  placeholder={locating ? 'Detecting city…' : 'City or current location'}
                  value={city}
                  onChange={(e) => applyCity(e.target.value, false)}
                  aria-label="City"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 size-8 -translate-y-1/2 rounded-lg text-blue-600 hover:text-blue-700"
                  onClick={() => void trackCurrentLocation(true)}
                  disabled={locating}
                  aria-label="Use current location"
                  title="Use current location"
                >
                  <LocateFixed className={`size-4 ${locating ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
              <Input
                className="rounded-xl"
                placeholder="Min ₹"
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input
                className="rounded-xl"
                placeholder="Max ₹"
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            {usingCurrentLocation && city ? (
              <p className="text-muted-foreground text-xs">
                Tracking your current location: <span className="font-medium text-foreground">{city}</span>
              </p>
            ) : null}

            <div className="space-y-2">
              <p className="font-medium text-sm">Features</p>
              <p className="text-muted-foreground text-xs">
                Show PGs that have any selected feature on the property or a room.
              </p>
              <FeatureCheckboxList value={features} onChange={setFeatures} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 sm:flex-1">
                Search
              </Button>
              {features.length ? (
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFeatures([])}>
                  Clear features
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="py-6 text-center text-muted-foreground text-sm">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground text-sm">No PGs match your filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((pg) => {
            const amenityList = asStringList(pg.amenities);
            const cover = firstImageUrl(pg.images);
            return (
              <Card key={pg.id} className="gap-0 overflow-hidden rounded-2xl border-zinc-200 pt-0 dark:border-zinc-800">
                <PgCardCover
                  src={cover}
                  alt={pg.name}
                  seed={pg.id || pg.name}
                  aspectRatio="16/10"
                  sizes="(min-width: 1280px) 33vw, 50vw"
                />
                <CardHeader className="space-y-2 pt-4">
                  <CardTitle className="line-clamp-1 text-base">{pg.name}</CardTitle>
                  <p className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="size-3" /> {pg.address}
                    {pg.city ? `, ${pg.city}` : ''}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-2 pb-5">
                  <p className="text-2xl">
                    <span className="font-semibold">
                      {pg.rentRangeMin && pg.rentRangeMax
                        ? `₹${Number(pg.rentRangeMin).toLocaleString('en-IN')} – ₹${Number(pg.rentRangeMax).toLocaleString('en-IN')}`
                        : 'Contact for price'}
                    </span>
                    <span className="ml-1 text-muted-foreground text-sm">/month</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {amenityList.slice(0, 4).map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">
                        {a}
                      </Badge>
                    ))}
                    {amenityList.length > 4 ? (
                      <Badge variant="outline" className="text-xs">
                        +{amenityList.length - 4}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {pg.totalRooms - pg.occupiedRooms} of {pg.totalRooms} rooms available
                  </p>
                  <Link href={`/renter/pgs/${pg.id}`}>
                    <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">View & Book</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
