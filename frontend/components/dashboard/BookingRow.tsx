'use client';

import Link from 'next/link';
import type { Booking } from '@/types';
import { Avatar } from '@/components/coach/Avatar';
import { Button } from '@/components/ui/Button';
import { BookingStatusPill, PaymentStatusPill } from '@/components/booking/BookingStatusPill';
import { useUpdateBookingStatus } from '@/lib/api/bookings';
import { formatPrice } from '@/lib/utils/valorant';
import { formatSlot } from '@/lib/utils/dates';
import { toast } from 'sonner';
import { MessageSquare, Star, Check, X } from 'lucide-react';
import { useState } from 'react';
import { ReviewForm } from '@/components/reviews/ReviewForm';

interface BookingRowProps {
  booking: Booking;
  perspective: 'client' | 'coach';
}

export function BookingRow({ booking, perspective }: BookingRowProps) {
  const updateStatus = useUpdateBookingStatus();
  const [showReview, setShowReview] = useState(false);

  const otherUser =
    perspective === 'client'
      ? booking.coach?.user
      : booking.client;

  const otherLabel = otherUser?.username ?? '?';

  async function setStatus(status: Booking['status']) {
    try {
      await updateStatus.mutateAsync({ id: booking.id, status });
      toast.success('Statut mis à jour');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar
          src={otherUser?.avatarUrl ?? null}
          username={otherLabel}
          size={42}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{otherLabel}</span>
            <BookingStatusPill status={booking.status} />
            <PaymentStatusPill status={booking.payment} />
          </div>
          <div className="mt-1 text-sm text-muted">
            {formatSlot(booking.startsAt)} · {formatPrice(booking.amount)}
            {perspective === 'coach' && booking.payment === 'PAID' && (
              <span className="ml-2 text-success">
                → {formatPrice(booking.payoutCents)} nets
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Actions coach */}
          {perspective === 'coach' && booking.status === 'CONFIRMED' && (
            <Button size="sm" variant="accent" onClick={() => setStatus('COMPLETED')}>
              <Check className="h-3.5 w-3.5" />
              Marquer terminé
            </Button>
          )}
          {perspective === 'coach' && booking.status === 'PENDING' && (
            <Button size="sm" variant="accent" onClick={() => setStatus('CONFIRMED')}>
              <Check className="h-3.5 w-3.5" />
              Confirmer
            </Button>
          )}
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <Button size="sm" variant="ghost" onClick={() => setStatus('CANCELLED')}>
              <X className="h-3.5 w-3.5" />
              Annuler
            </Button>
          )}

          {/* Actions client */}
          {perspective === 'client' &&
            booking.status === 'COMPLETED' &&
            !booking.review && (
              <Button size="sm" variant="primary" onClick={() => setShowReview((v) => !v)}>
                <Star className="h-3.5 w-3.5" />
                {showReview ? 'Fermer' : 'Laisser un avis'}
              </Button>
            )}

          <Link href={`/chat/${booking.id}`}>
            <Button size="sm" variant="outline">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Button>
          </Link>
        </div>
      </div>

      {showReview && (
        <div className="mt-4 border-t border-border pt-4">
          <ReviewForm bookingId={booking.id} onSuccess={() => setShowReview(false)} />
        </div>
      )}
    </div>
  );
}
