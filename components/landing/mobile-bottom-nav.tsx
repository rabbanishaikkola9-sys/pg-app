import Link from 'next/link';
import { Building2, Home, LogIn, Search } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/#search', label: 'Search', icon: Search },
  { href: '/#owners', label: 'Owners', icon: Building2 },
  { href: '/login', label: 'Login', icon: LogIn },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-zinc-200 border-t bg-white/95 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
      <ul className="mx-auto grid max-w-xl grid-cols-4 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <Icon className="size-4 text-blue-600" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
