'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  raisedByName: string | null;
  pgName: string | null;
};

const statusColor = (s: string) =>
  s === 'OPEN'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : s === 'IN_PROGRESS'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : s === 'RESOLVED'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tickets');
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = async (id: string, status: Ticket['status']) => {
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

  const filtered = useMemo(() => {
    if (!search) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) => t.subject.toLowerCase().includes(q) || (t.raisedByName ?? '').toLowerCase().includes(q),
    );
  }, [tickets, search]);

  const stats = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === 'OPEN').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    }),
    [tickets],
  );

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Support Tickets</h1>
        <p className="text-muted-foreground text-sm">Manage user inquiries and platform issues.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Open', value: String(stats.open), color: 'text-blue-600' },
          { label: 'In Progress', value: String(stats.inProgress), color: 'text-amber-600' },
          { label: 'Resolved', value: String(stats.resolved), color: 'text-emerald-600' },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">{s.label}</p>
              <p className={`mt-1 font-semibold text-2xl tracking-tight ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">All Tickets</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
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
            <p className="py-6 text-center text-muted-foreground text-sm">No tickets.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Raised By</TableHead>
                  <TableHead className="hidden lg:table-cell">PG</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate font-medium text-sm">{t.subject}</p>
                      <p className="truncate text-muted-foreground text-xs">{t.description}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-sm md:table-cell">
                      {t.raisedByName ?? '—'}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-sm lg:table-cell">
                      {t.pgName ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v as Ticket['status'])}>
                        <SelectTrigger className={`h-8 w-[140px] rounded-lg ${statusColor(t.status)}`}>
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
                    <TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
                      {new Date(t.createdAt).toLocaleDateString()}
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
