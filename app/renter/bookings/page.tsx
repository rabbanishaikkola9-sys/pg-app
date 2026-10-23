'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Booking = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT';
  moveInDate: string;
  message: string | null;
  createdAt: string;
  pgName: string | null;
  roomNumber: string | null;
  roomPrice: string | null;
};

const statusColor = (s: string) =>
  s === 'PENDING'
    ? 'bg-amber-100 text-amber-700'
    : s === 'APPROVED' || s === 'CHECKED_IN'
      ? 'bg-emerald-100 text-emerald-700'
      : s === 'REJECTED' || s === 'CANCELLED'
        ? 'bg-zinc-200 text-zinc-700'
        : 'bg-blue-100 text-blue-700';

export default function RenterBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data.bookings ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cancel = async (id: string) => {
    if (!confirm('Cancel this booking request?')) return;
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    if (res.ok) {
      toast.success('Cancelled');
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">My Bookings</h1>
        <p className="text-muted-foreground text-sm">Your past and current booking requests.</p>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="size-5 text-blue-500" /> Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Loading...</p>
          ) : bookings.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">
              No bookings yet. Browse PGs to send a request.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PG</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Move-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.pgName ?? '—'}</TableCell>
                    <TableCell>
                      R{b.roomNumber} • ₹{Number(b.roomPrice ?? 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{b.moveInDate}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(b.status)}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-xs md:table-cell">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {b.status === 'PENDING' || b.status === 'APPROVED' ? (
                        <Button size="sm" variant="outline" className="gap-1 rounded-lg" onClick={() => cancel(b.id)}>
                          <X className="size-3" /> Cancel
                        </Button>
                      ) : null}
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
