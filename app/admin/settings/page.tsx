'use client';

import { motion } from 'framer-motion';
import { Database, Globe, Lock, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function SystemSettingsPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">System Settings</h1>
        <p className="text-muted-foreground text-sm">Configure platform defaults and security protocols.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="space-y-6">
          {/* Platform Defaults */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="size-5 text-emerald-500" /> Platform Defaults
              </CardTitle>
              <CardDescription>Regional settings and currency configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input id="currency" defaultValue="INR (₹)" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">System Timezone</Label>
                  <Input id="timezone" defaultValue="Asia/Kolkata (IST)" className="rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="size-5 text-red-500" /> Security & Access
              </CardTitle>
              <CardDescription>Admin console security and API restrictions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Auth</Label>
                  <p className="text-muted-foreground text-xs">Enforce 2FA for all admin accounts.</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-muted-foreground text-xs">Temporarily disable public access.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="size-5 text-indigo-500" /> Infrastructure
              </CardTitle>
              <CardDescription>Database connections and system health.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-900 dark:text-emerald-100">All Systems Operational</p>
                    <p className="text-emerald-700 dark:text-emerald-300">Database connected: postgresql-main</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl">
              Revert Changes
            </Button>
            <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
              <Save className="size-4" /> Save Configuration
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
