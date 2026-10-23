'use client';

import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  raisedByName: string | null;
  pgName: string | null;
  createdAt: string;
};

export default function OwnerTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/tickets');
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setStatus = async (id: string, status: Ticket['status']) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Marked ${status}`);
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Tenant Tickets</h1>
        <p className="text-muted-foreground text-sm">Issues raised by tenants at your properties.</p>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LifeBuoy className="size-5 text-blue-500" /> Tickets ({tickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No tickets yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>PG</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate font-medium text-sm">{t.subject}</p>
                      <p className="truncate text-muted-foreground text-xs">{t.description}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{t.raisedByName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{t.pgName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.priority === 'HIGH' || t.priority === 'URGENT'
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400'
                            : ''
                        }
                      >
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={(v) => setStatus(t.id, v as Ticket['status'])}>
                        <SelectTrigger className="h-8 w-[140px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">OPEN</SelectItem>
                          <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                          <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                          <SelectItem value="CLOSED">CLOSED</SelectItem>
                        </SelectContent>
                      </Select>
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
