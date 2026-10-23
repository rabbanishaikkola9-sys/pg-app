'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, MapPin, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { StoredImage } from '@/components/images/stored-image';
import { firstImageUrl, getDefaultPgPlaceholder } from '@/lib/images';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Pg = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  totalRooms: number;
  occupiedRooms: number;
  rentRangeMin: string | null;
  rentRangeMax: string | null;
  isActive: boolean;
  ownerName: string | null;
  images?: string[];
};

export default function ViewAllPGsPage() {
  const [pgs, setPgs] = useState<Pg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/pgs');
    const data = await res.json();
    setPgs(data.pgs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!search) return pgs;
    const q = search.toLowerCase();
    return pgs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.ownerName ?? '').toLowerCase().includes(q),
    );
  }, [pgs, search]);

  const stats = useMemo(() => {
    const total = pgs.length;
    const active = pgs.filter((p) => p.isActive).length;
    const full = pgs.filter((p) => p.totalRooms > 0 && p.occupiedRooms >= p.totalRooms).length;
    const occRates = pgs.filter((p) => p.totalRooms > 0).map((p) => p.occupiedRooms / p.totalRooms);
    const avg = occRates.length ? Math.round((occRates.reduce((a, b) => a + b, 0) / occRates.length) * 100) : 0;
    return { total, active, full, avg };
  }, [pgs]);

  const remove = async (id: string) => {
    if (!confirm('Delete this PG? This cannot be undone.')) return;
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
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">All PG Properties</h1>
          <p className="text-muted-foreground text-sm">Browse and manage all registered paying-guest properties.</p>
        </div>
        <Link href="/admin/pgs/create">
          <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
            <Plus className="size-4" /> Create New PG
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total PGs', value: String(stats.total) },
          { label: 'Active', value: String(stats.active) },
          { label: 'Full Occupancy', value: String(stats.full) },
          { label: 'Avg. Occupancy', value: `${stats.avg}%` },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">{stat.label}</p>
              <p className="mt-1 font-semibold text-2xl tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">PG Directory</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search PGs..."
              className="rounded-xl pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No PGs found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PG Name</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden lg:table-cell">Owner</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead className="hidden sm:table-cell">Rent Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((pg) => {
                  const cover = firstImageUrl(pg.images);
                  return (
                    <TableRow key={pg.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <StoredImage
                              src={cover ?? getDefaultPgPlaceholder(pg.id || pg.name)}
                              alt={pg.name}
                              sizes="36px"
                            />
                          </span>
                          {pg.name}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                          <MapPin className="size-3" />
                          {pg.address}
                          {pg.city ? `, ${pg.city}` : ''}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">{pg.ownerName ?? '—'}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {pg.occupiedRooms}/{pg.totalRooms}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm sm:table-cell">
                        {pg.rentRangeMin && pg.rentRangeMax
                          ? `₹${Number(pg.rentRangeMin).toLocaleString('en-IN')} – ₹${Number(pg.rentRangeMax).toLocaleString('en-IN')}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pg.isActive ? 'default' : 'secondary'}
                          className={
                            pg.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : ''
                          }
                        >
                          {pg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/renter/pgs/${pg.id}`} className="gap-2">
                                <Eye className="size-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled className="gap-2">
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => remove(pg.id)}>
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
