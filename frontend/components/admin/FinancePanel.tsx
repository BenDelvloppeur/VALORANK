'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/coach/Avatar';
import { useAdminStats, useFinanceTimeseries, useTopCoaches } from '@/lib/api/admin';
import { formatPrice } from '@/lib/utils/valorant';
import { cn } from '@/lib/utils/cn';
import { TrendingUp } from 'lucide-react';

const RANGES: { id: number; label: string }[] = [
  { id: 7, label: '7 j' },
  { id: 30, label: '30 j' },
  { id: 90, label: '90 j' },
];

export function FinancePanel() {
  const [days, setDays] = useState<number>(30);
  const { data: stats } = useAdminStats();
  const { data: top } = useTopCoaches();
  const { data: ts, isLoading } = useFinanceTimeseries(days);

  const ratePct = Math.round((stats?.commissionRate ?? 0) * 100);

  // Normalisation pour le bar chart
  const max = ts?.length ? Math.max(1, ...ts.map((p) => p.revenue)) : 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold" />
                Évolution des revenus
              </span>
            </CardTitle>
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
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <KpiBox
                  label="Revenus encaissés"
                  value={formatPrice(ts.reduce((acc, p) => acc + p.revenue, 0))}
                />
                <KpiBox
                  label={`Commission plateforme (${ratePct}%)`}
                  value={formatPrice(ts.reduce((acc, p) => acc + p.commission, 0))}
                  highlight
                />
                <KpiBox
                  label="Sessions payées"
                  value={ts.reduce((acc, p) => acc + p.count, 0).toString()}
                />
              </div>

              {/* Bar chart maison */}
              <div className="flex h-44 items-end gap-1 overflow-x-auto rounded-md border border-border bg-surface-2 p-3">
                {ts.map((p) => {
                  const h = (p.revenue / max) * 100;
                  const ch = (p.commission / max) * 100;
                  return (
                    <div
                      key={p.date}
                      className="group relative flex h-full min-w-[8px] flex-1 flex-col justify-end"
                      title={`${p.date} • ${formatPrice(p.revenue)} (commission ${formatPrice(p.commission)})`}
                    >
                      <div
                        className="w-full rounded-t bg-primary/40 transition-all group-hover:bg-primary/70"
                        style={{ height: `${Math.max(h, p.revenue > 0 ? 4 : 0)}%` }}
                      >
                        <div
                          className="w-full rounded-t bg-gold/80"
                          style={{ height: `${(ch / Math.max(h, 0.001)) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{ts[0]?.date}</span>
                <div className="flex gap-3">
                  <Legend color="bg-primary/40" label="Revenus" />
                  <Legend color="bg-gold/80" label="Commission" />
                </div>
                <span>{ts[ts.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détail par coach</CardTitle>
        </CardHeader>
        <CardContent>
          {!top || top.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Aucune réservation payée pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted">
                    <th className="px-3 py-2">Coach</th>
                    <th className="px-3 py-2 text-right">Sessions</th>
                    <th className="px-3 py-2 text-right">Revenus</th>
                    <th className="px-3 py-2 text-right">Commission</th>
                    <th className="px-3 py-2 text-right">Reversé</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((row) => (
                    <tr
                      key={row.coachId}
                      className="border-b border-border/60 hover:bg-surface-2/50"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={row.coach?.user?.avatarUrl ?? null}
                            username={row.coach?.user?.username ?? '?'}
                            size={28}
                          />
                          {row.coach?.user?.username}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{row.bookings}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatPrice(row.revenueCents)}
                      </td>
                      <td className="px-3 py-2 text-right text-gold">
                        {formatPrice(row.commissionCents)}
                      </td>
                      <td className="px-3 py-2 text-right text-muted">
                        {formatPrice(row.payoutCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiBox({
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
        'rounded-lg border bg-surface-2 p-4',
        highlight ? 'border-gold/40' : 'border-border',
      )}
    >
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={cn('mt-1 text-xl font-bold', highlight && 'text-gold')}>{value}</div>
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
