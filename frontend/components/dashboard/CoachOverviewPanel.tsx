'use client';

import Link from 'next/link';
import {
  Inbox,
  CheckCircle2,
  Wallet,
  Star,
  Calendar,
  Users,
  Sparkles,
  AlertCircle,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/coach/Avatar';
import { StarRating } from '@/components/coach/StarRating';
import { useCoachStats } from '@/lib/api/coaches';
import { formatPrice } from '@/lib/utils/valorant';
import { formatSlot, relative } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

export function CoachOverviewPanel() {
  const { data, isLoading } = useCoachStats();

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const acceptanceRate =
    data.bookings.total > 0
      ? Math.round(
          ((data.bookings.confirmed + data.bookings.completed) / data.bookings.total) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Inbox className="h-5 w-5" />}
          label="Sessions à venir"
          value={data.bookings.upcoming}
          sub={`${data.bookings.pending} en attente • ${data.bookings.confirmed} confirmées`}
          accent="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Sessions terminées"
          value={data.bookings.completed}
          sub={`+${data.bookings.newBookings7d} nouvelles cette semaine`}
          accent="success"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Revenus nets perçus"
          value={formatPrice(data.finance.payoutCents)}
          sub={`30 derniers jours : ${formatPrice(data.finance.payoutCents30d)}`}
          accent="accent"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Note moyenne"
          value={data.reviews.avg ? data.reviews.avg.toFixed(2) : '—'}
          sub={`${data.reviews.count} avis reçus`}
          accent="warning"
        />
      </div>

      {/* Bandeau coach featured */}
      {data.profile.featured && (
        <div className="flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">
          <Sparkles className="h-5 w-5 text-gold" />
          <div>
            <div className="font-semibold text-gold">
              Tu es recommandé par Valorank
            </div>
            <div className="text-xs text-muted">
              Ton profil bénéficie d'une mise en avant prioritaire dans le listing.
            </div>
          </div>
        </div>
      )}

      {/* Prochaine session + Performances */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Prochaine session */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Prochaine session
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.nextBooking ? (
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  src={data.nextBooking.client?.avatarUrl ?? null}
                  username={data.nextBooking.client?.username ?? '?'}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {data.nextBooking.client?.username}
                    </span>
                    <Badge
                      variant={
                        data.nextBooking.status === 'CONFIRMED' ? 'success' : 'warning'
                      }
                    >
                      {data.nextBooking.status === 'CONFIRMED'
                        ? 'Confirmée'
                        : 'En attente'}
                    </Badge>
                    <Badge>
                      {formatPrice(data.nextBooking.payoutCents)} nets
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {formatSlot(data.nextBooking.startsAt)} • {relative(data.nextBooking.startsAt)}
                  </div>
                </div>
                <Link href={`/chat/${data.nextBooking.id}`}>
                  <Button size="sm" variant="primary">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Ouvrir le chat
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="py-4 text-sm text-muted">
                Aucune session planifiée. Ajoute des créneaux pour attirer les joueurs.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Performances rapides */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Performances
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Perf
              label="Taux d'acceptation"
              value={`${acceptanceRate}%`}
              progress={acceptanceRate}
            />
            <Perf
              label="Clients uniques"
              value={data.uniqueClients.toString()}
              icon={<Users className="h-4 w-4" />}
            />
            <Perf
              label="Créneaux à venir"
              value={`${data.availability.bookedSlots} / ${data.availability.upcomingSlots}`}
              progress={
                data.availability.upcomingSlots > 0
                  ? Math.round(
                      (data.availability.bookedSlots / data.availability.upcomingSlots) * 100,
                    )
                  : 0
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Notes : distribution */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 text-gold" />
              Distribution des notes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.reviews.count === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              Pas encore d'avis. Termine quelques sessions pour récolter tes premières
              évaluations.
            </p>
          ) : (
            <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
              <div className="text-center">
                <div className="text-5xl font-bold text-gold">
                  {data.reviews.avg.toFixed(1)}
                </div>
                <StarRating value={data.reviews.avg} size={18} className="mt-2 justify-center" />
                <div className="mt-1 text-xs text-muted">
                  basée sur {data.reviews.count} avis
                </div>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rate) => {
                  const count = data.reviews.distribution[rate as 1 | 2 | 3 | 4 | 5];
                  const pct = data.reviews.count
                    ? Math.round((count / data.reviews.count) * 100)
                    : 0;
                  return (
                    <div key={rate} className="flex items-center gap-3 text-sm">
                      <span className="flex w-8 items-center gap-1">
                        {rate}
                        <Star className="h-3 w-3 fill-gold text-gold" />
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full bg-gold/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-muted">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disponibilité info */}
      {data.availability.freeSlots === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Plus aucun créneau libre</div>
            <div className="mt-1 text-xs text-warning/80">
              Tous tes créneaux à venir sont déjà réservés. Ajoute-en d'autres dans
              l'onglet « Disponibilités » pour rester découvrable.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Perf({
  label,
  value,
  progress,
  icon,
}: {
  label: string;
  value: string;
  progress?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          {icon}
          {label}
        </span>
        <span className="font-semibold">{value}</span>
      </div>
      {progress !== undefined && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress >= 70
                ? 'bg-success'
                : progress >= 40
                  ? 'bg-primary'
                  : 'bg-warning',
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
