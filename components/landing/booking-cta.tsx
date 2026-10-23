'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  pgId: string;
  roomId: string;
  roomNumber: string;
  available: boolean;
  isAuthenticated: boolean;
  canBook: boolean;
};

export function BookingCta({ pgId, roomId, roomNumber, available, isAuthenticated, canBook }: Props) {
  const router = useRouter();
  const [moveInDate, setMoveInDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <Button
        className="w-full rounded-xl bg-blue-600 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-500/30 hover:shadow-lg"
        disabled={!available}
        onClick={() => {
          const next = `/pgs/${pgId}`;
          router.push(`/signup?next=${encodeURIComponent(next)}`);
        }}
      >
        <Lock className="mr-1 h-3.5 w-3.5" />
        Sign up to book
      </Button>
    );
  }

  if (!canBook) {
    return (
      <Button className="w-full rounded-xl" variant="outline" disabled>
        Renter account required
      </Button>
    );
  }

  const submit = async () => {
    if (!moveInDate) {
      toast.error('Pick a move-in date');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pgId, roomId, moveInDate, message }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success('Booking request sent');
      router.push('/renter/bookings');
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Failed to book');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="w-full rounded-xl bg-blue-600 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-500/30 hover:shadow-lg"
          disabled={!available}
        >
          Request Booking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Room {roomNumber}</DialogTitle>
          <DialogDescription>Send a request to the PG owner. They will approve or reject it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Move-in Date</Label>
            <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Message (optional)</Label>
            <Textarea
              placeholder="Anything the owner should know..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700">
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
