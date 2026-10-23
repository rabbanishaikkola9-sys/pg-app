'use client';

import { useCallback, useEffect, useState } from 'react';
import { BadgeIndianRupee, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Invoice = {
  id: string;
  amount: string;
  dueDate: string;
  status: 'PAID' | 'PENDING';
  paidAt: string | null;
  tenantId: string;
  renterName: string | null;
  pgName: string | null;
  roomNumber: string | null;
};

type Tenant = {
  id: string;
  userName: string | null;
  pgName: string | null;
  roomNumber: string | null;
};

export default function OwnerBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const refresh = useCallback(async () => {
    const [i, t] = await Promise.all([
      fetch('/api/billing').then((r) => r.json()),
      fetch('/api/tenants').then((r) => r.json()),
    ]);
    setInvoices(i.invoices ?? []);
    setTenants(t.tenants ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, amount: Number(amount), dueDate }),
    });
    if (res.ok) {
      toast.success('Invoice created');
      setAmount('');
      setDueDate('');
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  const markPaid = async (id: string) => {
    const res = await fetch(`/api/billing/${id}`, { method: 'PUT' });
    if (res.ok) {
      toast.success('Marked paid');
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  const totalDue = invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Rent Collection</h1>
        <p className="text-muted-foreground text-sm">Create invoices and track payments.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Pending</p>
            <p className="mt-1 font-semibold text-2xl tracking-tight">₹{totalDue.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Collected</p>
            <p className="mt-1 font-semibold text-2xl tracking-tight">₹{totalPaid.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="size-5 text-blue-500" /> New Invoice
          </CardTitle>
          <CardDescription>Generate a rent invoice for a tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInvoice} className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Tenant</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.userName} • {t.pgName} R{t.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="9000"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeIndianRupee className="size-5 text-blue-500" /> Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>PG / Room</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.renterName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {inv.pgName} • R{inv.roomNumber}
                    </TableCell>
                    <TableCell>₹{Number(inv.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.status === 'PENDING' ? (
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => markPaid(inv.id)}>
                          Mark Paid
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
