import { count, eq, sum } from 'drizzle-orm';
import { BadgeIndianRupee, Building2, ReceiptText, Ticket, Users, UsersRound } from 'lucide-react';
import { db } from '@/db';
import { billing, pgProperties, profiles, supportTickets, tenants } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getStats() {
  const [pgs] = await db.select({ value: count() }).from(pgProperties);
  const [renters] = await db.select({ value: count() }).from(tenants);
  const [owners] = await db.select({ value: count() }).from(profiles).where(eq(profiles.role, 'MANAGER'));
  const [openTickets] = await db
    .select({ value: count() })
    .from(supportTickets)
    .where(eq(supportTickets.status, 'OPEN'));
  const [pending] = await db
    .select({ value: sum(billing.amount) })
    .from(billing)
    .where(eq(billing.status, 'PENDING'));
  const [paid] = await db
    .select({ value: sum(billing.amount) })
    .from(billing)
    .where(eq(billing.status, 'PAID'));

  return {
    totalPgs: pgs.value,
    activeRenters: renters.value,
    totalOwners: owners.value,
    openTickets: openTickets.value,
    pendingDues: Number(pending.value ?? 0),
    monthlyRevenue: Number(paid.value ?? 0),
  };
}

function formatInr(value: number) {
  return `INR ${Math.round(value).toLocaleString('en-IN')}`;
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { title: 'Total PGs', value: String(stats.totalPgs), icon: Building2, subtext: 'Across the platform' },
    { title: 'Active Renters', value: String(stats.activeRenters), icon: UsersRound, subtext: 'Currently checked-in' },
    { title: 'PG Owners', value: String(stats.totalOwners), icon: Users, subtext: 'Registered managers' },
    { title: 'Open Tickets', value: String(stats.openTickets), icon: Ticket, subtext: 'Awaiting resolution' },
    { title: 'Pending Dues', value: formatInr(stats.pendingDues), icon: ReceiptText, subtext: 'Outstanding invoices' },
    {
      title: 'Collected Revenue',
      value: formatInr(stats.monthlyRevenue),
      icon: BadgeIndianRupee,
      subtext: 'All-time paid',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">
          Real-time platform metrics across properties, tenants, and collections.
        </p>
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
