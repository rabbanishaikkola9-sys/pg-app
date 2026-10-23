import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Super Admin Dashboard | PG Finder',
  description: 'Restricted super admin area for PG operations and system management.',
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin/dashboard');
  if (user.role !== 'ADMIN') redirect('/login?error=forbidden');

  return <AdminShell user={{ name: user.fullName, email: user.email }}>{children}</AdminShell>;
}
