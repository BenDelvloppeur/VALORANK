'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  useAdminConversations,
  useAdminRefundBooking,
  useAdminUpdateBookingStatus,
  useDeleteBooking,
} from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/coach/Avatar';
import { BookingStatusPill } from '@/components/booking/BookingStatusPill';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatShort, relative } from '@/lib/utils/dates';
import { formatPrice } from '@/lib/utils/valorant';
import { cn } from '@/lib/utils/cn';
import {
  MessageSquare,
  Eye,
  Inbox,
  Trash2,
  Star,
  RefreshCcw,
  Search,
  Wallet,
} from 'lucide-react';
import type { BookingStatus } from '@/types';

type FilterMode = 'all' | 'upcoming' | 'past';

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'past', label: 'Historique' },
];

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmée' },
  { value: 'COMPLETED', label: 'Terminée' },
  { value: 'CANCELLED', label: 'Annulée' },
];

export function ConversationsList() {
  const { data, isLoading } = useAdminConversations();
  const deleteBooking = useDeleteBooking();
  const updateStatus = useAdminUpdateBookingStatus();
  const refund = useAdminRefundBooking();

  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data;
    if (filter !== 'all') {
      rows = rows.filter((b) => {
        const isPast =
          b.status === 'COMPLETED' ||
          b.status === 'CANCELLED' ||
          new Date(b.endsAt) < new Date();
        return filter === 'past' ? isPast : !isPast;
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (b) =>
          b.client?.username.toLowerCase().includes(q) ||
          b.coach?.user?.username.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, filter, search]);

  async function handleDelete(id: string, label: string) {
    if (
      !confirm(
        `Supprimer définitivement la réservation de "${label}" ?\n\n` +
          `Tous les messages, l'avis associé et la réservation elle-même seront effacés.\n` +
          `Le créneau du coach sera libéré.`,
      )
    )
      return;
    try {
      await deleteBooking.mutateAsync(id);
      toast.success('Réservation supprimée');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function handleStatus(id: string, status: BookingStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Statut mis à jour');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function handleRefund(id: string, label: string) {
    if (!confirm(`Rembourser la réservation de "${label}" ? La booking sera annulée.`)) return;
    try {
      await refund.mutateAsync(id);
      toast.success('Remboursée');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

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
        icon={<Inbox className="h-7 w-7" />}
        title="Aucune réservation"
        description="Les réservations apparaîtront ici dès qu'un client en créera une."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            Réservations ({filtered.length}
            {(filter !== 'all' || search) && ` / ${data.length}`})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-48 pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    filter === f.id
                      ? 'bg-primary/15 text-primary-200'
                      : 'text-muted hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState title="Aucune réservation dans cette catégorie" />
        ) : (
          <ul className="space-y-2">
            {filtered.map((conv) => {
              const lastMsg = conv.messages[0];
              const labelForDelete = `${conv.client?.username} ↔ ${conv.coach?.user?.username}`;
              const ratePct = Math.round((conv.commissionRate ?? 0) * 100);
              return (
                <li
                  key={conv.id}
                  className="space-y-3 rounded-lg border border-border bg-surface-2 p-4"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Client / Coach */}
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={conv.client?.avatarUrl ?? null}
                          username={conv.client?.username ?? '?'}
                          size={32}
                        />
                        <span className="text-sm font-medium">
                          {conv.client?.username}
                        </span>
                      </div>
                      <span className="text-xs text-muted">↔</span>
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={conv.coach?.user?.avatarUrl ?? null}
                          username={conv.coach?.user?.username ?? '?'}
                          size={32}
                        />
                        <span className="text-sm font-medium">
                          {conv.coach?.user?.username}
                        </span>
                      </div>
                    </div>

                    {/* Statut + meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusPill status={conv.status} />
                      <Badge variant={conv.payment === 'PAID' ? 'success' : conv.payment === 'REFUNDED' ? 'danger' : 'default'}>
                        <Wallet className="h-3 w-3" />
                        {conv.payment}
                      </Badge>
                      <Badge>
                        <MessageSquare className="h-3 w-3" />
                        {conv._count.messages}
                      </Badge>
                      {conv.review && (
                        <Badge variant="warning">
                          <Star className="h-3 w-3 fill-current" />
                          {conv.review.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    {/* Booking date */}
                    <div className="text-xs text-muted">{formatShort(conv.startsAt)}</div>
                  </div>

                  {/* Finance breakdown */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <FinTile label="Total payé" value={formatPrice(conv.amount)} />
                    <FinTile
                      label={`Commission (${ratePct}%)`}
                      value={formatPrice(conv.commissionCents)}
                      highlight
                    />
                    <FinTile label="Reversé coach" value={formatPrice(conv.payoutCents)} />
                    <FinTile
                      label="Dernier msg"
                      value={lastMsg ? relative(lastMsg.createdAt) : '—'}
                      sub={lastMsg ? `${lastMsg.sender?.username}: ${lastMsg.content}` : undefined}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={conv.status}
                      onChange={(e) =>
                        handleStatus(conv.id, e.target.value as BookingStatus)
                      }
                      className="h-8 w-auto text-xs"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                    <Link href={`/chat/${conv.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3.5 w-3.5" />
                        Lire le chat
                      </Button>
                    </Link>
                    {conv.payment === 'PAID' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRefund(conv.id, labelForDelete)}
                        loading={refund.isPending}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Rembourser
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(conv.id, labelForDelete)}
                      title="Supprimer la réservation et son chat"
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                      Supprimer
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FinTile({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-md border bg-surface px-3 py-2',
        highlight ? 'border-gold/40' : 'border-border/60',
      )}
    >
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={cn('truncate text-sm font-semibold', highlight && 'text-gold')}>
        {value}
      </div>
      {sub && <div className="truncate text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
