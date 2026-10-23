'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeIndianRupee,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersistedBoolean } from '@/lib/use-persisted-boolean';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/owner/properties', label: 'My Properties', icon: Building2 },
  { href: '/owner/bookings', label: 'Booking Requests', icon: CalendarCheck },
  { href: '/owner/tenants', label: 'Tenants', icon: Users },
  { href: '/owner/billing', label: 'Rent Collection', icon: BadgeIndianRupee },
  { href: '/owner/tickets', label: 'Support', icon: LifeBuoy },
  { href: '/owner/profile', label: 'My Profile', icon: UserRound },
];

const STORAGE_KEY = 'owner-sidebar-collapsed';

function Sidebar({
  pathname,
  onLogout,
  collapsed,
  onToggle,
}: {
  pathname: string;
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col gap-4 p-4">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between gap-2 px-2')}>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-semibold text-lg tracking-tight">PG Owner</p>
              <p className="truncate text-muted-foreground text-xs">Manage your properties</p>
            </div>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hidden size-8 shrink-0 md:inline-flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          )}
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                  collapsed && 'justify-center px-2',
                  active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onLogout}
                className="mt-auto flex items-center justify-center rounded-lg px-2 py-2 text-destructive text-sm transition hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={onLogout}
            className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-destructive text-sm transition hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}

export function OwnerShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, toggleCollapsed] = usePersistedBoolean(STORAGE_KEY);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside
        className={cn(
          'hidden border-r bg-background transition-[width] duration-200 ease-in-out md:block',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <Sidebar pathname={pathname} onLogout={logout} collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Owner Navigation</SheetTitle>
                </SheetHeader>
                <Sidebar pathname={pathname} onLogout={logout} />
              </SheetContent>
            </Sheet>
            <p className="font-medium text-sm md:hidden">Owner</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-1.5 md:flex">
              <div className="text-right">
                <p className="font-medium text-xs leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{user.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
