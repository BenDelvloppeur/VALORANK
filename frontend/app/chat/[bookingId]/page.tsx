'use client';

import { use } from 'react';
import Link from 'next/link';
import { useBooking } from '@/lib/api/bookings';
import { useMe } from '@/lib/api/auth';
import { Avatar } from '@/components/coach/Avatar';
import { Button } from '@/components/ui/Button';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { formatSlot } from '@/lib/utils/dates';

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function ChatPage({ params }: PageProps) {
  const { bookingId } = use(params);
  const { data: me } = useMe();
  const { data: booking, isLoading } = useBooking(bookingId);

  if (isLoading) return <FullPageSpinner />;
  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <EmptyState title="Conversation introuvable" />
      </div>
    );
  }

  const isClient = me?.id === booking.clientId;
  const isCoach = me?.id === booking.coach?.user?.id;
  const isAdmin = me?.role === 'ADMIN';
  const isParticipant = isClient || isCoach;

  // Pour le header on affiche "l'autre côté" si participant, sinon "Client ↔ Coach" pour admin.
  const otherUser = isClient
    ? booking.coach?.user
    : isCoach
      ? booking.client
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href={isAdmin && !isParticipant ? '/admin' : me?.role === 'COACH' ? '/dashboard' : '/client'}>
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </Link>

      <header className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        {isAdmin && !isParticipant ? (
          // Vue admin : on affiche les deux participants
          <>
            <ShieldCheck className="h-5 w-5 text-warning" />
            <div className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar
                  src={booking.client?.avatarUrl ?? null}
                  username={booking.client?.username ?? '?'}
                  size={32}
                />
                <span className="text-sm font-medium">{booking.client?.username}</span>
              </div>
              <span className="text-muted">↔</span>
              <div className="flex items-center gap-2">
                <Avatar
                  src={booking.coach?.user?.avatarUrl ?? null}
                  username={booking.coach?.user?.username ?? '?'}
                  size={32}
                />
                <span className="text-sm font-medium">{booking.coach?.user?.username}</span>
              </div>
            </div>
            <div className="text-xs text-muted">{formatSlot(booking.startsAt)}</div>
          </>
        ) : (
          <>
            <Avatar
              src={otherUser?.avatarUrl ?? null}
              username={otherUser?.username ?? '?'}
              size={42}
            />
            <div>
              <div className="font-display text-lg">
                {otherUser?.username ?? 'Conversation'}
              </div>
              <div className="text-xs text-muted">
                Session du {formatSlot(booking.startsAt)}
              </div>
            </div>
          </>
        )}
      </header>

      <ChatWindow bookingId={bookingId} moderationMode={isAdmin && !isParticipant} />
    </div>
  );
}
