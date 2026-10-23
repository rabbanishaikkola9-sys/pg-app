'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BedDouble, MapPin, Phone, Mail } from 'lucide-react';
import { PgImageGallery } from '@/components/landing/pg-image-gallery';
import { sanitizeImageUrls } from '@/lib/images';
import { pgDetailFromResponse, readPgIdParam } from '@/lib/pg-detail';
import { asStringList } from '@/lib/pg-features';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Pg = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  amenities: unknown;
  images?: string[];
  totalRooms: number;
  occupiedRooms: number;
  rentRangeMin: string | null;
  rentRangeMax: string | null;
};

type Room = {
  id: string;
  roomNumber: string;
  price: string;
  capacity: number;
  currentOccupancy: number;
  hasAc?: boolean;
  features?: unknown;
};
type Owner = { name: string | null; email: string | null; phone: string | null };

export default function PgDetailPage() {
  const params = useParams();
  const id = readPgIdParam(params.id);
  const router = useRouter();
  const [pg, setPg] = useState<Pg | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [moveInDate, setMoveInDate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        if (!cancelled) {
          setPg(null);
          setRooms([]);
          setOwner(null);
          setError('PG not found.');
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(`/api/pgs/${id}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const parsed = pgDetailFromResponse(res.ok, data);
        if (!parsed.ok) {
          setPg(null);
          setRooms([]);
          setOwner(null);
          setError(parsed.error);
        } else {
          setPg(parsed.pg as Pg);
          setRooms(parsed.rooms as Room[]);
          setOwner(parsed.owner as Owner | null);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setPg(null);
          setError('Could not load this PG.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const book = async () => {
    if (!id || !selectedRoom || !moveInDate) return;
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pgId: id, roomId: selectedRoom.id, moveInDate, message }),
    });
    if (res.ok) {
      toast.success('Booking request sent');
      router.push('/renter/bookings');
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Failed to book');
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (!pg) return <p className="text-muted-foreground text-sm">{error ?? 'PG not found.'}</p>;

  const amenities = asStringList(pg.amenities);
  const images = sanitizeImageUrls(pg.images);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/renter/search">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">{pg.name}</h1>
          <p className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="size-3" /> {pg.address}, {pg.city} {pg.state} {pg.pincode}
          </p>
        </div>
      </div>

      <PgImageGallery images={images} name={pg.name} fallbackGradient="from-blue-500 via-indigo-500 to-purple-500" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-zinc-200 md:col-span-2 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">About this PG</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">{pg.description || 'No description provided.'}</p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <Badge key={a} variant="outline">
                  {a}
                </Badge>
              ))}
              {amenities.length === 0 ? (
                <span className="text-muted-foreground text-xs">No amenities listed.</span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Rooms</p>
                <p className="font-medium">
                  {pg.totalRooms - pg.occupiedRooms} available / {pg.totalRooms} total
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Rent Range</p>
                <p className="font-medium">
                  {pg.rentRangeMin && pg.rentRangeMax
                    ? `₹${Number(pg.rentRangeMin).toLocaleString('en-IN')} – ₹${Number(pg.rentRangeMax).toLocaleString('en-IN')}`
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{owner?.name ?? '—'}</p>
            {owner?.email ? (
              <p className="flex items-center gap-1 text-muted-foreground">
                <Mail className="size-3" /> {owner.email}
              </p>
            ) : null}
            {owner?.phone ? (
              <p className="flex items-center gap-1 text-muted-foreground">
                <Phone className="size-3" /> {owner.phone}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BedDouble className="size-5 text-blue-500" /> Available Rooms
          </CardTitle>
          <CardDescription>Pick a room and send a booking request.</CardDescription>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No rooms listed yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((r) => {
                const available = r.currentOccupancy < r.capacity;
                return (
                  <Card key={r.id} className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <CardContent className="space-y-2 pt-5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Room {r.roomNumber}</p>
                        <Badge
                          variant={available ? 'default' : 'secondary'}
                          className={available ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                        >
                          {available ? 'Available' : 'Full'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {r.currentOccupancy}/{r.capacity} occupied
                      </p>
                      <div className="flex flex-wrap gap-1">
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
                      <p className="font-semibold text-xl">
                        ₹{Number(r.price).toLocaleString('en-IN')}{' '}
                        <span className="font-normal text-muted-foreground text-xs">/month</span>
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                            disabled={!available}
                            onClick={() => setSelectedRoom(r)}
                          >
                            Request Booking
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book Room {selectedRoom?.roomNumber}</DialogTitle>
                            <DialogDescription>
                              Send a request to the PG owner. They will approve or reject it.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label>Move-in Date</Label>
                              <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label>Message (optional)</Label>
                              <Textarea
                                placeholder="Anything the owner should know..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={book} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                              Send Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
