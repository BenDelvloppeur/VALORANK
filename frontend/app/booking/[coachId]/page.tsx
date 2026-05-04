'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCoach } from '@/lib/api/coaches';
import { useCreateBooking, usePayBooking } from '@/lib/api/bookings';
import { useMe } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { AvailabilityList } from '@/components/booking/AvailabilityList';
import { MockCheckout } from '@/components/booking/MockCheckout';
import { Avatar } from '@/components/coach/Avatar';
import { RankBadge } from '@/components/coach/RankBadge';
import { formatSlot } from '@/lib/utils/dates';
import { formatPrice } from '@/lib/utils/valorant';
import { ArrowLeft, ArrowRight, Calendar, ShoppingCart, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Booking } from '@/types';

type Step = 'select' | 'review' | 'pay' | 'done';

const STEPS: { id: Step; label: string; icon: typeof Calendar }[] = [
  { id: 'select', label: 'Créneau', icon: Calendar },
  { id: 'review', label: 'Récapitulatif', icon: ShoppingCart },
  { id: 'pay', label: 'Paiement', icon: Receipt },
];

interface PageProps {
  params: Promise<{ coachId: string }>;
}

export default function BookingFlowPage({ params }: PageProps) {
  const { coachId } = use(params);
  const router = useRouter();

  const { data: coach, isLoading } = useCoach(coachId);
  const { data: me } = useMe();
  const createBooking = useCreateBooking();
  const payBooking = usePayBooking();

  const [step, setStep] = useState<Step>('select');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const selectedSlot = useMemo(
    () => coach?.availabilities?.find((a) => a.id === selectedSlotId),
    [coach, selectedSlotId],
  );

  if (isLoading || !coach) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Le coach ne peut pas se réserver lui-même
  if (me && coach.userId === me.id) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Impossible</h1>
        <p className="mt-2 text-muted">Tu ne peux pas réserver ta propre offre.</p>
      </div>
    );
  }

  async function goToReview() {
    if (!selectedSlotId) {
      toast.error('Sélectionne un créneau');
      return;
    }
    setStep('review');
  }

  async function confirmBooking() {
    if (!selectedSlotId) return;
    try {
      const created = await createBooking.mutateAsync(selectedSlotId);
      setBooking(created);
      setStep('pay');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la réservation');
    }
  }

  async function handlePay() {
    if (!booking) return;
    try {
      await payBooking.mutateAsync(booking.id);
      setStep('done');
      toast.success('Paiement validé. À très vite !');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec du paiement');
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      {/* Stepper */}
      <ol className="mb-10 flex items-center justify-center gap-2 sm:gap-6">
        {STEPS.map((s, idx) => {
          const stepIdx = STEPS.findIndex((x) => x.id === step);
          const isActive = stepIdx === idx;
          const isDone = stepIdx > idx || step === 'done';
          const Icon = s.icon;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  isDone && 'border-success bg-success/15 text-success',
                  isActive && 'border-primary bg-primary/15 text-primary-200 shadow-glow',
                  !isActive && !isDone && 'border-border text-muted',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:inline',
                  isActive ? 'text-foreground' : 'text-muted',
                )}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="h-px w-8 bg-border sm:w-12" />
              )}
            </li>
          );
        })}
      </ol>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar
              src={coach.user?.avatarUrl ?? null}
              username={coach.user?.username ?? '?'}
              size={48}
            />
            <div className="flex-1">
              <CardTitle>{coach.user?.username}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <RankBadge rank={coach.rank} size="sm" />
                <span className="text-sm text-muted">
                  {formatPrice(coach.hourlyRate)} / heure
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h2 className="mb-4 font-display text-xl">Choisis un créneau</h2>
                <AvailabilityList
                  availabilities={coach.availabilities ?? []}
                  selectedId={selectedSlotId}
                  onSelect={setSelectedSlotId}
                />
                <div className="mt-6 flex justify-end">
                  <Button onClick={goToReview} disabled={!selectedSlotId}>
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'review' && selectedSlot && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <h2 className="font-display text-xl">Récapitulatif</h2>
                <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface-2 p-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase text-muted">Coach</dt>
                    <dd className="mt-1 font-medium">{coach.user?.username}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted">Créneau</dt>
                    <dd className="mt-1 font-medium">{formatSlot(selectedSlot.startsAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted">Durée</dt>
                    <dd className="mt-1 font-medium">1 heure</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted">Total</dt>
                    <dd className="mt-1 font-display text-xl text-primary">
                      {formatPrice(coach.hourlyRate)}
                    </dd>
                  </div>
                </dl>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep('select')}>
                    <ArrowLeft className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button onClick={confirmBooking} loading={createBooking.isPending}>
                    Confirmer et payer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'pay' && booking && (
              <motion.div
                key="pay"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h2 className="mb-4 font-display text-xl">Paiement</h2>
                <MockCheckout
                  amount={booking.amount}
                  onPay={handlePay}
                  loading={payBooking.isPending}
                />
              </motion.div>
            )}

            {step === 'done' && booking && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 py-6 text-center"
              >
                <div className="font-display text-3xl">🎉 Tout est prêt !</div>
                <p className="text-muted">
                  Ta session est confirmée pour le{' '}
                  <span className="font-medium text-foreground">
                    {formatSlot(booking.startsAt)}
                  </span>
                  .
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => router.push('/client')}>
                    Voir mes sessions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/chat/${booking.id}`)}
                  >
                    Discuter avec le coach
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
