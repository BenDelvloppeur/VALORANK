'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMe } from '@/lib/api/auth';
import { useMyBookings } from '@/lib/api/bookings';
import { useCoaches } from '@/lib/api/coaches';
import { useMyApplication } from '@/lib/api/applications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BookingRow } from '@/components/dashboard/BookingRow';
import { CoachCard } from '@/components/coach/CoachCard';
import { Avatar } from '@/components/coach/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/admin/StatCard';
import {
  ListTodo,
  History,
  Compass,
  Trophy,
  CalendarCheck,
  Wallet,
  Users,
  Star,
  Sparkles,
  Crown,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/valorant';
import { formatSlot, relative } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import type { BookingStatus } from '@/types';

type Tab = 'overview' | 'upcoming' | 'history';

export default function ClientDashboardPage() {
  const { data: me, isLoading } = useMe();
  const { data: bookings, isLoading: loadingBookings } = useMyBookings();
  const { data: featuredCoaches } = useCoaches({ sort: 'rating' });
  const { data: application } = useMyApplication(me?.role === 'CLIENT');

  if (isLoading || loadingBookings || !me) return <FullPageSpinner />;

  const asClient = bookings?.asClient ?? [];
  const upcoming = asClient.filter(
    (b) => b.status === 'PENDING' || b.status === 'CONFIRMED',
  );
  const history = asClient.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED',
  );
  const completed = asClient.filter((b) => b.status === 'COMPLETED');

  const totalSpent = asClient
    .filter((b) => b.payment === 'PAID')
    .reduce((sum, b) => sum + b.amount, 0);
  const uniqueCoaches = new Set(asClient.map((b) => b.coachId)).size;
  const avgRatingGiven =
    completed.length > 0
      ? completed.filter((b) => b.review).length / completed.length
      : 0;

  const nextSession = upcoming
    .slice()
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

  // Top 3 coachs recommandés (excluant ceux déjà réservés)
  const bookedCoachIds = new Set(asClient.map((b) => b.coachId));
  const recommended =
    (featuredCoaches ?? [])
      .filter((c) => !bookedCoachIds.has(c.id))
      .slice(0, 3) ?? [];

  const showBecomeCoach = me.role === 'CLIENT';
  const applicationLabel = application
    ? application.status === 'PENDING'
      ? 'Ta candidature est en cours d\'examen'
      : application.status === 'REJECTED'
        ? 'Ta dernière candidature a été refusée — tu peux la retravailler'
        : null
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Salut {me.username} 👋</h1>
          <p className="mt-1 text-muted">
            Voici ton récap. Réserve ta prochaine session quand tu es prêt.
          </p>
        </div>
        <Link href="/coaches">
          <Button>
            <Compass className="h-4 w-4" />
            Trouver un coach
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Sessions à venir"
          value={upcoming.length}
          accent="primary"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Sessions terminées"
          value={completed.length}
          accent="success"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Total dépensé"
          value={formatPrice(totalSpent)}
          accent="accent"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Coachs essayés"
          value={uniqueCoaches}
          accent="warning"
        />
      </div>

      {/* Bannière Devenir coach */}
      {showBecomeCoach && (
        <BecomeCoachBanner applicationLabel={applicationLabel} />
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" icon={<Sparkles className="h-4 w-4" />}>
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="upcoming" icon={<ListTodo className="h-4 w-4" />}>
            À venir ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history" icon={<History className="h-4 w-4" />}>
            Historique ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {nextSession && <NextSessionCard booking={nextSession} />}

            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-gold" />
                    Coachs recommandés pour toi
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommended.length === 0 ? (
                  !featuredCoaches ? (
                    <div className="flex justify-center py-6">
                      <Spinner />
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-muted">
                      Tu as essayé tous nos coachs disponibles ! 🚀
                    </p>
                  )
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recommended.map((c) => (
                      <CoachCard key={c.id} coach={c} />
                    ))}
                  </div>
                )}
                <div className="mt-4 text-center">
                  <Link href="/coaches">
                    <Button variant="outline">
                      Voir tous les coachs
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {completed.length > 0 && (
              <ReviewsToWriteCard bookings={completed.filter((b) => !b.review)} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <BookingsTab
            bookings={upcoming}
            empty={
              <EmptyState
                icon={<Trophy className="h-7 w-7" />}
                title="Pas encore de session prévue"
                description="Trouve un coach et réserve ton premier créneau."
                action={
                  <Link href="/coaches">
                    <Button>Voir les coachs</Button>
                  </Link>
                }
              />
            }
          />
        </TabsContent>

        <TabsContent value="history">
          <BookingsTab
            bookings={history}
            empty={
              <EmptyState
                icon={<History className="h-7 w-7" />}
                title="Aucune session passée"
              />
            }
            sortDesc
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NextSessionCard({
  booking,
}: {
  booking: import('@/types').Booking;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Ta prochaine session
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            src={booking.coach?.user?.avatarUrl ?? null}
            username={booking.coach?.user?.username ?? '?'}
            size={56}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">
                {booking.coach?.user?.username}
              </span>
              <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}>
                {booking.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted">
              {formatSlot(booking.startsAt)} • {relative(booking.startsAt)}
            </div>
            <div className="mt-1 text-sm text-foreground/80">
              {formatPrice(booking.amount)}
            </div>
          </div>
          <Link href={`/chat/${booking.id}`}>
            <Button>
              <MessageSquare className="h-4 w-4" />
              Ouvrir le chat
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewsToWriteCard({
  bookings,
}: {
  bookings: import('@/types').Booking[];
}) {
  if (bookings.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-gold" />
            Sessions à évaluer ({bookings.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted">
          Tes retours aident toute la communauté à choisir les bons coachs.
        </p>
        <div className="space-y-3">
          {bookings.slice(0, 3).map((b) => (
            <BookingRow key={b.id} booking={b} perspective="client" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingsTab({
  bookings,
  empty,
  sortDesc,
}: {
  bookings: import('@/types').Booking[];
  empty: React.ReactNode;
  sortDesc?: boolean;
}) {
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let rows = bookings;
    if (filter !== 'all') rows = rows.filter((b) => b.status === filter);
    return rows.sort((a, b) =>
      sortDesc
        ? new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
        : new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }, [bookings, filter, sortDesc]);

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent>{empty}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Sessions ({filtered.length})</CardTitle>
          <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
            {(
              [
                { id: 'all', label: 'Toutes' },
                { id: 'PENDING', label: 'En attente' },
                { id: 'CONFIRMED', label: 'Confirmées' },
                { id: 'COMPLETED', label: 'Terminées' },
                { id: 'CANCELLED', label: 'Annulées' },
              ] as const
            )
              .filter((opt) =>
                opt.id === 'all' ||
                bookings.some((b) => b.status === opt.id),
              )
              .map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilter(opt.id)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium',
                    filter === opt.id
                      ? 'bg-primary/15 text-primary-200'
                      : 'text-muted hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState title="Aucune session pour ce filtre" />
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => (
              <BookingRow key={b.id} booking={b} perspective="client" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BecomeCoachBanner({
  applicationLabel,
}: {
  applicationLabel: string | null;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-r from-accent/15 via-primary/5 to-transparent p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 text-accent-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg">
            {applicationLabel ?? 'Tu joues à haut niveau ? Deviens coach Valorank'}
          </h3>
          <p className="text-sm text-muted">
            {applicationLabel
              ? 'Suis ton dossier ou retravaille-le ici.'
              : 'Partage ton expertise, fixe ton tarif et accompagne d\'autres joueurs.'}
          </p>
        </div>
        <Link href="/become-coach">
          <Button variant="accent">
            {applicationLabel ? 'Voir ma candidature' : 'Postuler'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
