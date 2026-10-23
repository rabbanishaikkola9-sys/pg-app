import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OwnerShell } from '@/components/owner/owner-shell';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Owner Dashboard | PG Finder',
};

export default async function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/owner/dashboard');
  if (user.role !== 'MANAGER') redirect('/login?error=forbidden');
  return <OwnerShell user={{ name: user.fullName, email: user.email }}>{children}</OwnerShell>;
}
