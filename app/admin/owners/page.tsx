'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Mail, MoreHorizontal, Phone, Search, Trash2, UserPlus, Users } from 'lucide-react';
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

type Owner = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  pgCount: number;
  roomCount: number;
};

export default function OwnerListPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/owners');
    const data = await res.json();
    setOwners(data.owners ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!search) return owners;
    const q = search.toLowerCase();
    return owners.filter((o) => o.fullName.toLowerCase().includes(q) || o.email.toLowerCase().includes(q));
  }, [owners, search]);

  const stats = useMemo(() => {
    const total = owners.length;
    const avgPg = total ? (owners.reduce((s, o) => s + Number(o.pgCount), 0) / total).toFixed(1) : '0.0';
    const totalRooms = owners.reduce((s, o) => s + Number(o.roomCount), 0);
    return { total, avgPg, totalRooms };
  }, [owners]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Owner Directory</h1>
          <p className="text-muted-foreground text-sm">Manage PG property owners registered on the platform.</p>
        </div>
        <Link href="/admin/owners/onboard">
          <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
            <UserPlus className="size-4" /> Onboard Owner
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Owners', value: String(stats.total) },
          { label: 'Total Rooms Managed', value: String(stats.totalRooms) },
          { label: 'Avg. PGs per Owner', value: stats.avgPg },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">{s.label}</p>
              <p className="mt-1 font-semibold text-2xl tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Owners</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search owners..."
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
            <p className="py-6 text-center text-muted-foreground text-sm">No owners yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>PGs</TableHead>
                  <TableHead className="hidden sm:table-cell">Rooms</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <Users className="size-4 text-blue-500" /> {o.fullName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5 text-muted-foreground text-sm">
                        <p className="flex items-center gap-1">
                          <Mail className="size-3" /> {o.email}
                        </p>
                        {o.phone ? (
                          <p className="flex items-center gap-1">
                            <Phone className="size-3" /> {o.phone}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{Number(o.pgCount)}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm sm:table-cell">{Number(o.roomCount)}</TableCell>
                    <TableCell className="hidden text-muted-foreground text-sm lg:table-cell">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled className="gap-2">
                            <Eye className="size-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-destructive"
                            onClick={() => toast.message('Use the database admin to remove users.')}
                          >
                            <Trash2 className="size-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
