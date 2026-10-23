'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeIndianRupee,
  CalendarCheck,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersistedBoolean } from '@/lib/use-persisted-boolean';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/renter/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/renter/search', label: 'Find a PG', icon: Search },
  { href: '/renter/bookings', label: 'My Bookings', icon: CalendarCheck },
  { href: '/renter/billing', label: 'Rent & Dues', icon: BadgeIndianRupee },
  { href: '/renter/tickets', label: 'Support', icon: LifeBuoy },
  { href: '/renter/profile', label: 'My Profile', icon: UserRound },
];

const STORAGE_KEY = 'renter-sidebar-collapsed';

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
              <p className="truncate font-semibold text-lg tracking-tight">PG Finder</p>
              <p className="truncate text-muted-foreground text-xs">Renter</p>
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
        <div className="mt-auto space-y-1">
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className="flex items-center justify-center rounded-lg px-2 py-2 text-muted-foreground text-sm transition hover:bg-accent"
                  >
                    <Home className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Back to public site</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-destructive text-sm transition hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground text-sm transition hover:bg-accent"
              >
                <Home className="size-4" /> Back to public site
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-destructive text-sm transition hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export function RenterShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
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
                  <SheetTitle>Renter Navigation</SheetTitle>
                </SheetHeader>
                <Sidebar pathname={pathname} onLogout={logout} />
              </SheetContent>
            </Sheet>
            <p className="font-medium text-sm md:hidden">Renter</p>
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
