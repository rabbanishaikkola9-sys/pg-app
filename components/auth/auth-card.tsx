'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name is required'),
    role: z.enum(['STUDENT_PROFESSIONAL', 'PG_OWNER']),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export function AuthCard({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', role: 'STUDENT_PROFESSIONAL', email: '', password: '', confirmPassword: '' },
  });

  const onLoginSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      const next = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
      router.push(next ?? data.redirect ?? '/');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Login failed');
    }
  };

  const onSignupSubmit = async (values: SignupValues) => {
    setSubmitting(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      toast.success('Account created');
      router.push(data.redirect ?? '/');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Signup failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="w-full rounded-2xl border-zinc-200 bg-white/95 shadow-lg shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/95">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{mode === 'login' ? 'Welcome back' : 'Create your account'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Login to continue your PG search.'
              : 'Join as a student, professional, or PG owner.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {mode === 'login' ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  className="h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am</FormLabel>
                      <FormControl>
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl">
                            <TabsTrigger value="STUDENT_PROFESSIONAL">Student / Professional</TabsTrigger>
                            <TabsTrigger value="PG_OWNER">PG Owner</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimum 8 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  className="h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {mode === 'login' ? 'No account yet? ' : 'Already have an account? '}
            <Link href={mode === 'login' ? '/signup' : '/login'} className="text-blue-700 hover:underline">
              {mode === 'login' ? 'Sign up' : 'Login'}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
