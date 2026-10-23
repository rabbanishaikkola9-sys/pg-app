'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, Send, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Broadcast = {
  id: string;
  title: string;
  message: string;
  channel: string;
  isGlobal: boolean;
  targetRole: string | null;
  sentAt: string;
};

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('ALL');
  const [channel, setChannel] = useState<'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS'>('IN_APP');
  const [recent, setRecent] = useState<Broadcast[]>([]);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setRecent(data.notifications ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = async () => {
    if (!title || !message) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message,
        channel,
        targetRole: target === 'ALL' ? undefined : target,
        isGlobal: target === 'ALL',
      }),
    });
    setSending(false);
    if (res.ok) {
      toast.success('Broadcast sent');
      setTitle('');
      setMessage('');
      refresh();
    } else {
      toast.error('Failed to send');
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Global Notifications</h1>
        <p className="text-muted-foreground text-sm">Send broadcasts to all users, owners, or renters.</p>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="size-5 text-blue-500" /> New Broadcast
          </CardTitle>
          <CardDescription>Draft a message and select your target audience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              placeholder="e.g., Scheduled Maintenance"
              className="rounded-xl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              className="min-h-[120px] rounded-xl"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="TENANT">All Renters</SelectItem>
                  <SelectItem value="MANAGER">All PG Owners</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-App Notification</SelectItem>
                  <SelectItem value="EMAIL">Email Broadcast</SelectItem>
                  <SelectItem value="PUSH">Push</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-blue-600 dark:text-blue-400" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">Target</p>
                <p className="text-blue-700 dark:text-blue-300">
                  {target === 'ALL' ? 'Every user' : target === 'TENANT' ? 'All renters' : 'All PG owners'}
                </p>
              </div>
            </div>
          </div>
          <Button className="w-full gap-2 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={send} disabled={sending}>
            <Send className="size-4" /> {sending ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-medium text-lg">Recent Broadcasts</h2>
        <div className="grid gap-4">
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No broadcasts yet.</p>
          ) : (
            recent.map((b) => (
              <Card key={b.id} className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                <CardContent className="flex items-start justify-between py-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
                      <BellRing className="size-4 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{b.title}</p>
                      <p className="text-muted-foreground text-xs">{b.message}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(b.sentAt).toLocaleString()} •{' '}
                        {b.isGlobal ? 'All Users' : (b.targetRole ?? 'Targeted')} • {b.channel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
