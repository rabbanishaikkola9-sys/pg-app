import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';

export const metadata: Metadata = {
  title: 'Login | PG Finder',
  description: 'Secure login for PG Finder users and PG managers.',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className="inline-flex text-sm text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Home
        </Link>
        <AuthCard mode="login" />
      </div>
    </main>
  );
}
