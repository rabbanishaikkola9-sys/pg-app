import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/account/profile-form';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'My Profile | Owner' };

export default async function OwnerProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/owner/profile');
  return <ProfileForm user={{ fullName: user.fullName, email: user.email, phone: user.phone, role: user.role }} />;
}
