'use client';

import { Users, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/coach/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useCoachClients } from '@/lib/api/coaches';
import { formatPrice } from '@/lib/utils/valorant';
import { formatShort } from '@/lib/utils/dates';

export function CoachClientsPanel() {
  const { data, isLoading } = useCoachClients();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-7 w-7" />}
        title="Aucun client pour le moment"
        description="Tes premiers clients apparaîtront ici dès qu'ils auront réservé une session."
      />
    );
  }

  const totalRevenue = data.reduce((s, c) => s + c.payoutCents, 0);
  const totalSessions = data.reduce((s, c) => s + c.bookings, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Mini label="Clients uniques" value={data.length.toString()} />
        <Mini label="Sessions totales" value={totalSessions.toString()} />
        <Mini label="Revenus nets cumulés" value={formatPrice(totalRevenue)} highlight />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-gold" />
              Top clients
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2 text-right">Sessions</th>
                  <th className="px-3 py-2 text-right">Net perçu</th>
                  <th className="px-3 py-2 text-right">Brut payé</th>
                  <th className="px-3 py-2">Dernière session</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={row.clientId}
                    className="border-b border-border/60 hover:bg-surface-2/50"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs font-mono text-muted">
                          {idx + 1}
                        </span>
                        <Avatar
                          src={row.client?.avatarUrl ?? null}
                          username={row.client?.username ?? '?'}
                          size={32}
                        />
                        <span className="font-medium">{row.client?.username}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Badge>{row.bookings}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-success">
                      {formatPrice(row.payoutCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">
                      {formatPrice(row.revenueCents)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {row.lastSession
                        ? `${formatShort(row.lastSession.startsAt)} • ${row.lastSession.status}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
      className={`rounded-xl border p-5 ${
        highlight ? 'border-success/40 bg-success/5' : 'border-border bg-surface'
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold ${highlight ? 'text-success' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
