'use client';

import { useCallback, useEffect, useState } from 'react';
import { BadgeIndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Invoice = {
  id: string;
  amount: string;
  dueDate: string;
  status: 'PAID' | 'PENDING';
  paidAt: string | null;
  pgName: string | null;
  roomNumber: string | null;
};

export default function RenterBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/billing');
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pay = async (id: string) => {
    if (!confirm('Mark this invoice as paid? (Demo — wire to your gateway later.)')) return;
    const res = await fetch(`/api/billing/${id}`, { method: 'PUT' });
    if (res.ok) {
      toast.success('Marked paid');
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  const due = invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + Number(i.amount), 0);
  const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Rent & Dues</h1>
        <p className="text-muted-foreground text-sm">All your invoices, in one place.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Pending</p>
            <p className="mt-1 font-semibold text-2xl tracking-tight">₹{due.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Paid (lifetime)</p>
            <p className="mt-1 font-semibold text-2xl tracking-tight">₹{paid.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeIndianRupee className="size-5 text-blue-500" /> Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PG</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.pgName ?? '—'}</TableCell>
                    <TableCell>R{inv.roomNumber}</TableCell>
                    <TableCell>₹{Number(inv.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          className="rounded-lg bg-blue-600 hover:bg-blue-700"
                          onClick={() => pay(inv.id)}
                        >
                          Pay
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
