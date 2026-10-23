import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RenterShell } from '@/components/renter/renter-shell';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Renter | PG Finder',
};

export default async function RenterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/renter/dashboard');
  if (user.role !== 'TENANT') redirect('/login?error=forbidden');
  return <RenterShell user={{ name: user.fullName, email: user.email }}>{children}</RenterShell>;
}
