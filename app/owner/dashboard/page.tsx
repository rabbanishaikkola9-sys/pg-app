import { and, count, eq, inArray, sum } from 'drizzle-orm';
import { BadgeIndianRupee, Building2, CalendarCheck, ReceiptText, UsersRound } from 'lucide-react';
import { db } from '@/db';
import { billing, bookings, pgProperties, tenants } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';

async function getStats(ownerId: string) {
  const myPgs = await db.select({ id: pgProperties.id }).from(pgProperties).where(eq(pgProperties.ownerId, ownerId));
  const pgIds = myPgs.map((p) => p.id);

  if (!pgIds.length) {
    return { totalPgs: 0, activeTenants: 0, pendingBookings: 0, monthlyRevenue: 0, pendingDues: 0 };
  }

  const [tenantCount] = await db.select({ value: count() }).from(tenants).where(inArray(tenants.pgId, pgIds));
  const [pending] = await db
    .select({ value: count() })
    .from(bookings)
    .where(and(inArray(bookings.pgId, pgIds), eq(bookings.status, 'PENDING')));

  const myTenants = await db.select({ id: tenants.id }).from(tenants).where(inArray(tenants.pgId, pgIds));
  const tenantIds = myTenants.map((t) => t.id);

  let pendingDues = 0;
  let paidSum = 0;
  if (tenantIds.length) {
    const [duesRow] = await db
      .select({ value: sum(billing.amount) })
      .from(billing)
      .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PENDING')));
    const [paidRow] = await db
      .select({ value: sum(billing.amount) })
      .from(billing)
      .where(and(inArray(billing.tenantId, tenantIds), eq(billing.status, 'PAID')));
    pendingDues = Number(duesRow.value ?? 0);
    paidSum = Number(paidRow.value ?? 0);
  }

  return {
    totalPgs: pgIds.length,
    activeTenants: tenantCount.value,
    pendingBookings: pending.value,
    monthlyRevenue: paidSum,
    pendingDues,
  };
}

function inr(value: number) {
  return `INR ${Math.round(value).toLocaleString('en-IN')}`;
}

export default async function OwnerDashboardPage() {
  const user = await requireRole('MANAGER');
  const stats = await getStats(user.id);

  const cards = [
    { title: 'My Properties', value: String(stats.totalPgs), icon: Building2, subtext: 'Currently managed' },
    { title: 'Active Tenants', value: String(stats.activeTenants), icon: UsersRound, subtext: 'Checked-in' },
    {
      title: 'Pending Booking Requests',
      value: String(stats.pendingBookings),
      icon: CalendarCheck,
      subtext: 'Need approval',
    },
    { title: 'Pending Dues', value: inr(stats.pendingDues), icon: ReceiptText, subtext: 'Awaiting payment' },
    { title: 'Collected Revenue', value: inr(stats.monthlyRevenue), icon: BadgeIndianRupee, subtext: 'All-time paid' },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Welcome, {user.fullName}</h1>
        <p className="text-muted-foreground text-sm">Overview of your PG operations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="rounded-2xl border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-medium text-sm text-zinc-600 dark:text-zinc-300">{stat.title}</CardTitle>
                <Icon className="size-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-semibold text-2xl tracking-tight">{stat.value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.subtext}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
