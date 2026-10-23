'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BedDouble, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from '@/components/images/image-uploader';
import { FeatureCheckboxList } from '@/components/pg/feature-checkbox-list';
import { asStringList, SEARCH_FEATURES } from '@/lib/pg-features';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Room = {
  id: string;
  roomNumber: string;
  price: string;
  capacity: number;
  currentOccupancy: number;
  hasAc?: boolean;
  features?: unknown;
};

type Pg = {
  id: string;
  name: string;
  address: string;
  city: string;
  totalRooms: number;
  occupiedRooms: number;
  images?: string[];
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pg, setPg] = useState<Pg | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomNumber, setRoomNumber] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [roomHasAc, setRoomHasAc] = useState(false);
  const [roomFeatures, setRoomFeatures] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [savingPhotos, setSavingPhotos] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/pgs/${id}`);
    const data = await res.json();
    setPg(data.pg);
    setRooms(data.rooms ?? []);
    setImages(Array.isArray(data.pg?.images) ? data.pg.images : []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/pgs/${id}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomNumber,
        price: Number(price),
        capacity: Number(capacity),
        hasAc: roomHasAc,
        features: roomFeatures,
      }),
    });
    if (res.ok) {
      toast.success('Room added');
      setRoomNumber('');
      setPrice('');
      setCapacity('1');
      setRoomHasAc(false);
      setRoomFeatures([]);
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Failed to add room');
    }
  };

  const savePhotos = async () => {
    setSavingPhotos(true);
    const res = await fetch(`/api/pgs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    });
    setSavingPhotos(false);
    if (res.ok) {
      toast.success('Photos saved');
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Failed to save photos');
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Delete this room?')) return;
    const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Room deleted');
      refresh();
    } else {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>;
  }
  if (!pg) {
    return <p className="text-muted-foreground text-sm">Property not found.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner/properties">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">{pg.name}</h1>
          <p className="text-muted-foreground text-sm">
            {pg.address}
            {pg.city ? `, ${pg.city}` : ''}
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImagePlus className="size-5 text-blue-500" /> Property photos
          </CardTitle>
          <CardDescription>Uploads are compressed and stored as base64 data URLs on this property.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploader value={images} onChange={setImages} />
          <div className="flex justify-end">
            <Button
              type="button"
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
              disabled={savingPhotos}
              onClick={savePhotos}
            >
              {savingPhotos ? 'Saving…' : 'Save photos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="size-5 text-blue-500" /> Add a Room
          </CardTitle>
          <CardDescription>
            Add rooms with price, capacity, AC, and features so renters can filter them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addRoom} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label>Room Number</Label>
                <Input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="101" required />
              </div>
              <div className="space-y-1">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="9000"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Capacity</Label>
                <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
              </div>
              <div className="flex items-end justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <Label htmlFor="room-ac" className="cursor-pointer text-sm">
                  AC
                </Label>
                <Switch
                  id="room-ac"
                  checked={roomHasAc}
                  onCheckedChange={setRoomHasAc}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Room features</Label>
              <FeatureCheckboxList
                value={roomFeatures}
                onChange={setRoomFeatures}
                options={SEARCH_FEATURES.filter((feature) => feature !== 'AC')}
              />
            </div>
            <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700">
              Add Room
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BedDouble className="size-5 text-blue-500" /> Rooms ({rooms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No rooms yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room #</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.roomNumber}</TableCell>
                    <TableCell>₹{Number(r.price).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{r.capacity}</TableCell>
                    <TableCell>
                      {r.currentOccupancy}/{r.capacity}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteRoom(r.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
