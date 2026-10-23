'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Building2, MapPin, Plus, Trash2 } from 'lucide-react';
import { PgCardCover } from '@/components/images/pg-card-cover';
import { firstImageUrl } from '@/lib/images';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Pg = {
  id: string;
  name: string;
  address: string;
  city: string;
  totalRooms: number;
  occupiedRooms: number;
  rentRangeMin: string | null;
  rentRangeMax: string | null;
  isActive: boolean;
  images?: string[];
};

export default function OwnerPropertiesPage() {
  const [pgs, setPgs] = useState<Pg[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const me = await fetch('/api/auth/me').then((r) => r.json());
    const id = me.user?.id;
    if (!id) {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/pgs?ownerId=${id}`);
    const data = await res.json();
    setPgs(data.pgs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = async (id: string) => {
    if (!confirm('Delete this PG? All rooms and bookings will be removed.')) return;
    const res = await fetch(`/api/pgs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('PG deleted');
      refresh();
    } else {
      toast.error('Failed to delete');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">My Properties</h1>
          <p className="text-muted-foreground text-sm">All the PGs you currently manage.</p>
        </div>
        <Link href="/owner/properties/new">
          <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
            <Plus className="size-4" /> Add Property
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="py-6 text-center text-muted-foreground text-sm">Loading...</p>
      ) : pgs.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Building2 className="size-8 text-blue-500" />
            <p className="font-medium">No properties yet</p>
            <p className="text-muted-foreground text-sm">Add your first PG to start managing rooms and tenants.</p>
            <Link href="/owner/properties/new">
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700">Add Property</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pgs.map((pg) => {
            const cover = firstImageUrl(pg.images);
            return (
              <Card key={pg.id} className="gap-0 overflow-hidden rounded-2xl border-zinc-200 pt-0 dark:border-zinc-800">
                <PgCardCover
                  src={cover}
                  alt={pg.name}
                  seed={pg.id || pg.name}
                  aspectRatio="16/9"
                  sizes="(min-width: 1280px) 33vw, 50vw"
                />
                <CardHeader className="space-y-2 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-1 text-base">{pg.name}</CardTitle>
                    <Badge
                      className={
                        pg.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-600'
                      }
                    >
                      {pg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="size-3" /> {pg.address}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Occupancy</p>
                      <p className="font-medium">
                        {pg.occupiedRooms}/{pg.totalRooms}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Rent</p>
                      <p className="font-medium">
                        {pg.rentRangeMin && pg.rentRangeMax
                          ? `₹${Number(pg.rentRangeMin).toLocaleString('en-IN')} – ₹${Number(pg.rentRangeMax).toLocaleString('en-IN')}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/owner/properties/${pg.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-xl">
                        Manage Rooms
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(pg.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
