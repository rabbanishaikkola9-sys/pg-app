'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BellRing,
  Building2,
  ChevronDown,
  Command,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  Ticket,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { PageTransition } from '@/components/ui/page-transition';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersistedBoolean } from '@/lib/use-persisted-boolean';
import { cn } from '@/lib/utils';

type AdminShellProps = {
  children: React.ReactNode;
  user?: { name: string; email: string };
};

const quickSearchItems = [
  { label: 'Sunrise Nest PG', href: '/admin/pgs' },
  { label: 'Urban Hive PG', href: '/admin/pgs' },
  { label: 'Aarav Mehta (Owner)', href: '/admin/owners' },
  { label: 'Ritika Sharma (Owner)', href: '/admin/owners' },
];

const STORAGE_KEY = 'admin-sidebar-collapsed';

const collapsedNav = [
  { href: '/admin/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { href: '/admin/pgs', label: 'PG Management', icon: Building2 },
  { href: '/admin/owners', label: 'Owner Management', icon: Users },
  { href: '/admin/notifications', label: 'Communications', icon: BellRing },
  { href: '/admin/settings', label: 'System Settings', icon: Settings2 },
  { href: '/admin/profile', label: 'My Profile', icon: UserRound },
];

function SidebarNav({
  onLogout,
  collapsed,
  onToggle,
}: {
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
              <p className="truncate font-semibold text-lg tracking-tight">PG Admin</p>
              <p className="truncate text-muted-foreground text-xs">Super Admin Console</p>
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

        {collapsed ? (
          <nav className="space-y-1">
            {collapsedNav.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className="flex items-center justify-center rounded-lg px-2 py-2 text-sm transition hover:bg-accent hover:text-accent-foreground"
                    >
                      <Icon className="size-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        ) : (
          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-accent hover:text-accent-foreground"
            >
              <LayoutDashboard className="size-4" />
              Dashboard Overview
            </Link>

            <Collapsible defaultOpen className="space-y-1">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-accent">
                <span className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  PG Management
                </span>
                <ChevronDown className="size-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-6">
                <Link
                  href="/admin/pgs/create"
                  className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
                >
                  Create New PG
                </Link>
                <Link href="/admin/pgs" className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent">
                  View All PGs
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen className="space-y-1">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-accent">
                <span className="flex items-center gap-2">
                  <Users className="size-4" />
                  Owner Management
                </span>
                <ChevronDown className="size-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-6">
                <Link
                  href="/admin/owners/onboard"
                  className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
                >
                  Onboard Owner
                </Link>
                <Link href="/admin/owners" className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent">
                  Owner List
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen className="space-y-1">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-accent">
                <span className="flex items-center gap-2">
                  <BellRing className="size-4" />
                  Communications
                </span>
                <ChevronDown className="size-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-6">
                <Link
                  href="/admin/notifications"
                  className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
                >
                  Global Notifications
                </Link>
                <Link href="/admin/tickets" className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent">
                  Support Tickets
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Link
              href="/admin/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              <Settings2 className="size-4" />
              System Settings
            </Link>

            <Link
              href="/admin/profile"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              <UserRound className="size-4" />
              My Profile
            </Link>
          </nav>
        )}

        <div className="mt-auto space-y-2">
          {!collapsed && (
            <div className="rounded-xl border bg-card p-3">
              <p className="flex items-center gap-2 font-medium text-sm">
                <ShieldCheck className="size-4 text-blue-500" /> Role: ADMIN
              </p>
              <p className="mt-1 text-muted-foreground text-xs">Restricted access console.</p>
            </div>
          )}
          {collapsed ? (
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
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-destructive text-sm transition hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export function AdminShell({ children, user }: AdminShellProps) {
  const router = useRouter();
  const [openPalette, setOpenPalette] = useState(false);
  const [collapsed, toggleCollapsed] = usePersistedBoolean(STORAGE_KEY);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpenPalette((prev) => !prev);
      }
    };

    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside
        className={cn(
          'hidden border-r bg-background transition-[width] duration-200 ease-in-out md:block',
          collapsed ? 'w-16' : 'w-72',
        )}
      >
        <SidebarNav onLogout={logout} collapsed={collapsed} onToggle={toggleCollapsed} />
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
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation</SheetTitle>
                </SheetHeader>
                <SidebarNav onLogout={logout} />
              </SheetContent>
            </Sheet>
            <p className="font-medium text-sm md:hidden">Admin</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2 text-muted-foreground"
              onClick={() => setOpenPalette(true)}
            >
              <Command className="size-4" />
              <span className="hidden sm:inline">Search PGs or Owners</span>
              <CommandShortcut>{'⌘K'}</CommandShortcut>
            </Button>
            {user ? (
              <div className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-1.5 md:flex">
                <div className="text-right">
                  <p className="font-medium text-xs leading-tight">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{user.email}</p>
                </div>
              </div>
            ) : null}
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className={cn('flex-1 p-4 md:p-6')}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <CommandDialog open={openPalette} onOpenChange={setOpenPalette}>
        <CommandInput placeholder="Search PGs or Owners..." />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup heading="Quick Search">
            {quickSearchItems.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => {
                  router.push(item.href);
                  setOpenPalette(false);
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                router.push('/admin/notifications');
                setOpenPalette(false);
              }}
            >
              <BellRing className="size-4" /> Broadcast Notification
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/admin/owners/onboard');
                setOpenPalette(false);
              }}
            >
              <UserPlus className="size-4" /> Onboard Owner
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/admin/tickets');
                setOpenPalette(false);
              }}
            >
              <Ticket className="size-4" /> Open Support Tickets
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/admin/settings');
                setOpenPalette(false);
              }}
            >
              <Settings2 className="size-4" /> System Settings
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/admin/settings');
                setOpenPalette(false);
              }}
            >
              <LifeBuoy className="size-4" /> Database Logs
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
