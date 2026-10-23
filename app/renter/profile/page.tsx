import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/account/profile-form';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'My Profile | Renter' };

export default async function RenterProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/renter/profile');
  return <ProfileForm user={{ fullName: user.fullName, email: user.email, phone: user.phone, role: user.role }} />;
}
