'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Tenant = {
  id: string;
  rentStatus: string;
  lastPaymentDate: string | null;
  joinedAt: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  pgName: string | null;
  roomNumber: string | null;
  roomPrice: string | null;
};

export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      setTenants(data.tenants ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">My Tenants</h1>
        <p className="text-muted-foreground text-sm">Renters currently staying at your properties.</p>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5 text-blue-500" /> All Tenants ({tenants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Loading...</p>
          ) : tenants.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No active tenants yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>PG / Room</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.userName ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5 text-muted-foreground text-xs">
                        {t.userEmail ? (
                          <p className="flex items-center gap-1">
                            <Mail className="size-3" /> {t.userEmail}
                          </p>
                        ) : null}
                        {t.userPhone ? (
                          <p className="flex items-center gap-1">
                            <Phone className="size-3" /> {t.userPhone}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.pgName} • Room {t.roomNumber}
                    </TableCell>
                    <TableCell>₹{Number(t.roomPrice ?? 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          t.rentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }
                      >
                        {t.rentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-sm lg:table-cell">
                      {new Date(t.joinedAt).toLocaleDateString()}
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
