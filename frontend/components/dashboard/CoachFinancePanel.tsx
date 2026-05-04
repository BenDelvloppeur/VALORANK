'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useCoachStats, useCoachTimeseries } from '@/lib/api/coaches';
import { formatPrice } from '@/lib/utils/valorant';
import { cn } from '@/lib/utils/cn';

const RANGES = [
  { id: 7, label: '7 j' },
  { id: 30, label: '30 j' },
  { id: 90, label: '90 j' },
];

export function CoachFinancePanel() {
  const [days, setDays] = useState(30);
  const { data: stats } = useCoachStats();
  const { data: ts, isLoading } = useCoachTimeseries(days);

  if (!stats) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const ratePct =
    stats.finance.revenueCents > 0
      ? Math.round((stats.finance.commissionCents / stats.finance.revenueCents) * 100)
      : 20;

  return (
    <div className="space-y-6">
      {/* KPIs finance */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinKpi
          icon={<Wallet className="h-5 w-5" />}
          label="Revenus nets (total)"
          value={formatPrice(stats.finance.payoutCents)}
          sub={`${stats.finance.paidBookings} sessions payées`}
          accent
        />
        <FinKpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="30 derniers jours"
          value={formatPrice(stats.finance.payoutCents30d)}
          sub={`${stats.finance.paidBookings30d} sessions`}
        />
        <FinKpi
          label="Brut encaissé par la plateforme"
          value={formatPrice(stats.finance.revenueCents)}
          sub="Avant commission"
        />
        <FinKpi
          label={`Commission Valorank (~${ratePct}%)`}
          value={formatPrice(stats.finance.commissionCents)}
          sub="Prélevée par la plateforme"
          danger
        />
      </div>

      {/* Note explicative */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-4 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Le client paie le prix affiché. La plateforme prélève une commission qui couvre
          l'hébergement, le paiement et la mise en relation. Tu reçois le reste — c'est ton
          <strong className="text-foreground"> revenu net</strong>. Le taux exact peut varier
          dans le temps ; il est figé au moment de chaque réservation.
        </p>
      </div>

      {/* Timeseries chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Évolution de tes revenus nets</CardTitle>
            <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDays(r.id)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    days === r.id
                      ? 'bg-primary/15 text-primary-200'
                      : 'text-muted hover:text-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || !ts ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <Chart data={ts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Chart({
  data,
}: {
  data: { date: string; revenue: number; payout: number; commission: number; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const totalPay = data.reduce((s, d) => s + d.payout, 0);
  const totalCom = data.reduce((s, d) => s + d.commission, 0);
  const totalCount = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Revenu brut sur la période" value={formatPrice(totalRev)} />
        <Mini label="Reçu net" value={formatPrice(totalPay)} highlight />
        <Mini label={`Commission (${totalCom > 0 ? Math.round((totalCom/totalRev)*100) : 0}%)`} value={formatPrice(totalCom)} />
      </div>

      <div className="flex h-44 items-end gap-1 overflow-x-auto rounded-md border border-border bg-surface-2 p-3">
        {data.map((p) => {
          const h = (p.revenue / max) * 100;
          const payH = h ? (p.payout / p.revenue) * h : 0;
          return (
            <div
              key={p.date}
              className="group relative flex h-full min-w-[8px] flex-1 flex-col justify-end"
              title={`${p.date}: ${formatPrice(p.revenue)} brut → ${formatPrice(p.payout)} nets (${formatPrice(p.commission)} commission)`}
            >
              <div
                className="w-full rounded-t bg-danger/40 transition-all group-hover:bg-danger/60"
                style={{ height: `${Math.max(h, p.revenue > 0 ? 4 : 0)}%` }}
              >
                <div
                  className="w-full rounded-t bg-success/70"
                  style={{ height: `${(payH / Math.max(h, 0.001)) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>{data[0]?.date}</span>
        <div className="flex gap-3">
          <Legend color="bg-success/70" label="Revenus nets" />
          <Legend color="bg-danger/40" label="Commission" />
        </div>
        <span>
          {data[data.length - 1]?.date} • {totalCount} sessions
        </span>
      </div>
    </div>
  );
}

function FinKpi({
  icon,
  label,
  value,
  sub,
  accent,
  danger,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        accent
          ? 'border-success/40 bg-success/5'
          : danger
            ? 'border-danger/40 bg-danger/5'
            : 'border-border bg-surface',
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          'mt-2 text-2xl font-bold',
          accent && 'text-success',
          danger && 'text-danger',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Mini({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-surface px-3 py-2',
        highlight ? 'border-success/40' : 'border-border',
      )}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={cn('mt-0.5 text-lg font-semibold', highlight && 'text-success')}>
        {value}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('h-2 w-3 rounded-sm', color)} />
      {label}
    </div>
  );
}
