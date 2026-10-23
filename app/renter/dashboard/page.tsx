import Link from 'next/link';
import { and, count, eq, inArray, sum } from 'drizzle-orm';
import { BadgeIndianRupee, CalendarCheck, Home, ReceiptText, Search } from 'lucide-react';
import { db } from '@/db';
import { billing, bookings, pgProperties, rooms, tenants } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';

async function getOverview(userId: string) {
  const myTenants = await db
    .select({
      id: tenants.id,
      rentStatus: tenants.rentStatus,
      joinedAt: tenants.joinedAt,
      pgId: tenants.pgId,
      pgName: pgProperties.name,
      pgAddress: pgProperties.address,
      roomNumber: rooms.roomNumber,
      roomPrice: rooms.price,
    })
    .from(tenants)
    .leftJoin(pgProperties, eq(pgProperties.id, tenants.pgId))
    .leftJoin(rooms, eq(rooms.id, tenants.roomId))
    .where(eq(tenants.userId, userId));

  const tenantIds = myTenants.map((t) => t.id);
  let pendingDues = 0;
  let openInvoices = 0;
  if (tenantIds.length) {
    const [duesRow] = await db
      .select({ value: sum(billing.amount) })
      .from(billing)
      .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PENDING')));
    const [openRow] = await db
      .select({ value: count() })
      .from(billing)
      .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PENDING')));
    pendingDues = Number(duesRow.value ?? 0);
    openInvoices = openRow.value;
  }

  const [pendingBookings] = await db
    .select({ value: count() })
    .from(bookings)
    .where(and(eq(bookings.renterId, userId), eq(bookings.status, 'PENDING')));

  return { tenancy: myTenants[0] ?? null, pendingDues, openInvoices, pendingBookings: pendingBookings.value };
}

export default async function RenterDashboardPage() {
  const user = await requireRole('TENANT');
  const overview = await getOverview(user.id);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Hi, {user.fullName.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">Your home, your bookings, your dues — all in one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="size-5 text-blue-500" /> Current Stay
            </CardTitle>
            <CardDescription>
              {overview.tenancy
                ? `${overview.tenancy.pgName} • Room ${overview.tenancy.roomNumber}`
                : "You're not staying anywhere yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview.tenancy ? (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{overview.tenancy.pgAddress}</p>
                <p>
                  Rent:{' '}
                  <span className="font-semibold">
                    ₹{Number(overview.tenancy.roomPrice ?? 0).toLocaleString('en-IN')}
                  </span>{' '}
                  /month
                </p>
                <p>
                  Status: <span className="font-medium">{overview.tenancy.rentStatus}</span>
                </p>
              </div>
            ) : (
              <Link href="/renter/search">
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700">
                  <Search className="mr-2 size-4" /> Find a PG
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Pending Dues</p>
                <p className="font-semibold text-2xl tracking-tight">₹{overview.pendingDues.toLocaleString('en-IN')}</p>
                <p className="text-muted-foreground text-xs">{overview.openInvoices} open invoice(s)</p>
              </div>
              <ReceiptText className="size-7 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Pending Booking Requests</p>
                <p className="font-semibold text-2xl tracking-tight">{overview.pendingBookings}</p>
              </div>
              <CalendarCheck className="size-7 text-blue-500" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/renter/search">
          <Card className="rounded-2xl border-zinc-200 transition hover:border-blue-300 dark:border-zinc-800">
            <CardContent className="flex items-center gap-3 pt-5">
              <Search className="size-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Find a PG</p>
                <p className="text-muted-foreground text-xs">Browse listings near you</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/renter/billing">
          <Card className="rounded-2xl border-zinc-200 transition hover:border-blue-300 dark:border-zinc-800">
            <CardContent className="flex items-center gap-3 pt-5">
              <BadgeIndianRupee className="size-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Pay Rent</p>
                <p className="text-muted-foreground text-xs">View and pay your invoices</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/renter/tickets">
          <Card className="rounded-2xl border-zinc-200 transition hover:border-blue-300 dark:border-zinc-800">
            <CardContent className="flex items-center gap-3 pt-5">
              <CalendarCheck className="size-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Raise a Ticket</p>
                <p className="text-muted-foreground text-xs">Report an issue at your PG</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}
