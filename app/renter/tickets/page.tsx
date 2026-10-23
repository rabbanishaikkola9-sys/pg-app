'use client';

import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  pgName: string | null;
};

export default function RenterTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Ticket['priority']>('MEDIUM');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/tickets');
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, description, priority }),
    });
    if (res.ok) {
      toast.success('Ticket raised');
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Support</h1>
        <p className="text-muted-foreground text-sm">Report an issue or request something from your PG owner.</p>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="size-5 text-blue-500" /> Raise a Ticket
          </CardTitle>
          <CardDescription>Your PG owner and the platform admin will see this.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Leaking tap in Room 102"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Ticket['priority'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700">
              Submit Ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LifeBuoy className="size-5 text-blue-500" /> My Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">You haven&apos;t raised any tickets.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Raised</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{t.subject}</p>
                      <p className="line-clamp-1 text-muted-foreground text-xs">{t.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-xs md:table-cell">
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
