'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Check, X } from 'lucide-react';
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
  renterName: string | null;
  renterEmail: string | null;
};

const statusColor = (s: string) =>
  s === 'PENDING'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : s === 'APPROVED' || s === 'CHECKED_IN'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : s === 'REJECTED' || s === 'CANCELLED'
        ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

export default function OwnerBookingsPage() {
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

  const updateStatus = async (id: string, status: Booking['status']) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(status === 'APPROVED' ? 'Booking approved — tenant created' : `Marked ${status}`);
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Booking Requests</h1>
        <p className="text-muted-foreground text-sm">Approve or reject renter applications.</p>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="size-5 text-blue-500" /> All Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Loading...</p>
          ) : bookings.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No booking requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Renter</TableHead>
                  <TableHead>PG / Room</TableHead>
                  <TableHead>Move-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[180px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{b.renterName ?? '—'}</p>
                        <p className="text-muted-foreground text-xs">{b.renterEmail ?? ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{b.pgName ?? '—'}</p>
                      <p className="text-muted-foreground text-xs">
                        Room {b.roomNumber} • ₹{Number(b.roomPrice ?? 0).toLocaleString('en-IN')}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{b.moveInDate}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(b.status)}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground text-xs">
                      {b.message ?? '—'}
                    </TableCell>
                    <TableCell>
                      {b.status === 'PENDING' ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => updateStatus(b.id, 'APPROVED')}
                          >
                            <Check className="size-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-lg"
                            onClick={() => updateStatus(b.id, 'REJECTED')}
                          >
                            <X className="size-3" /> Reject
                          </Button>
                        </div>
                      ) : b.status === 'APPROVED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => updateStatus(b.id, 'CHECKED_IN')}
                        >
                          Mark Checked-in
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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
