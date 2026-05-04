'use client';

import {
  Users,
  Crown,
  CalendarCheck,
  Wallet,
  TrendingUp,
  Banknote,
  Star,
  AlertTriangle,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/coach/Avatar';
import { useAdminStats, useTopCoaches } from '@/lib/api/admin';
import { formatPrice } from '@/lib/utils/valorant';

export function OverviewPanel() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: top } = useTopCoaches();

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const ratePct = Math.round((stats.commissionRate ?? 0) * 100);

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Utilisateurs"
          value={stats.users}
          sub={`+${stats.newUsers7d} sur 7j • ${stats.clients} clients`}
          accent="primary"
        />
        <StatCard
          icon={<Crown className="h-5 w-5" />}
          label="Coachs"
          value={stats.coaches}
          sub={`${stats.featuredCoaches} mis en avant`}
          accent="accent"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Réservations"
          value={stats.bookings}
          sub={`+${stats.newBookings7d} sur 7j • ${stats.completed} terminées`}
          accent="success"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Note moyenne"
          value={stats.avgRating ? stats.avgRating.toFixed(2) : '—'}
          sub={`${stats.reviewsCount} avis publiés`}
          accent="warning"
        />
      </div>

      {/* Bloc finances rapide */}
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Revenus encaissés (total)"
          value={formatPrice(stats.revenueCents)}
          sub={`${stats.paidBookings} sessions payées`}
          accent="primary"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={`Commission plateforme (${ratePct}%)`}
          value={formatPrice(stats.commissionCents)}
          sub={`30 derniers jours : ${formatPrice(stats.commissionCents30d)}`}
          accent="gold"
        />
        <StatCard
          icon={<Banknote className="h-5 w-5" />}
          label="Reversé aux coachs"
          value={formatPrice(stats.payoutCents)}
          sub={`30 derniers jours : ${formatPrice(stats.payoutCents30d)}`}
          accent="accent"
        />
      </div>

      {/* Statut des réservations */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline des réservations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatusTile
              label="En attente"
              value={stats.bookingsByStatus.pending}
              variant="warning"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <StatusTile
              label="Confirmées"
              value={stats.bookingsByStatus.confirmed}
              variant="primary"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <StatusTile
              label="Terminées"
              value={stats.bookingsByStatus.completed}
              variant="success"
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <StatusTile
              label="Annulées / remboursées"
              value={stats.bookingsByStatus.cancelled + stats.refundedCount}
              variant="danger"
              icon={<RefreshCcw className="h-4 w-4" />}
              sub={`${stats.refundedCount} remboursements (${formatPrice(stats.refundedCents)})`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top coachs */}
      <Card>
        <CardHeader>
          <CardTitle>Top coachs (par revenus)</CardTitle>
        </CardHeader>
        <CardContent>
          {!top || top.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Aucune réservation payée pour le moment.
            </p>
          ) : (
            <ul className="space-y-2">
              {top.map((row, idx) => (
                <li
                  key={row.coachId}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3"
                >
                  <span className="w-6 text-center text-xs font-mono text-muted">
                    #{idx + 1}
                  </span>
                  <Avatar
                    src={row.coach?.user?.avatarUrl ?? null}
                    username={row.coach?.user?.username ?? '?'}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {row.coach?.user?.username ?? '—'}
                    </div>
                    <div className="text-xs text-muted">
                      {row.bookings} session(s) • Reversé {formatPrice(row.payoutCents)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatPrice(row.revenueCents)}</div>
                    <div className="text-xs text-gold">
                      +{formatPrice(row.commissionCents)} commission
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusTile({
  label,
  value,
  variant,
  icon,
  sub,
}: {
  label: string;
  value: number;
  variant: 'primary' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-2">
        <Badge variant={variant}>
          {icon}
          {label}
        </Badge>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
