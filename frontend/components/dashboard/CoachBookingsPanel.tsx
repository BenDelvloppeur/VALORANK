'use client';

import { useMemo, useState } from 'react';
import { Inbox, Search, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookingRow } from './BookingRow';
import { useMyBookings } from '@/lib/api/bookings';
import { cn } from '@/lib/utils/cn';
import type { BookingStatus } from '@/types';

type Tab = 'upcoming' | 'pending' | 'history' | 'cancelled' | 'all';

const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'pending', label: 'En attente' },
  { id: 'history', label: 'Terminées' },
  { id: 'cancelled', label: 'Annulées' },
  { id: 'all', label: 'Toutes' },
];

function matchTab(status: BookingStatus, startsAt: string, tab: Tab) {
  const isFuture = new Date(startsAt) >= new Date();
  switch (tab) {
    case 'all':
      return true;
    case 'upcoming':
      return isFuture && (status === 'PENDING' || status === 'CONFIRMED');
    case 'pending':
      return status === 'PENDING';
    case 'history':
      return status === 'COMPLETED';
    case 'cancelled':
      return status === 'CANCELLED';
  }
}

export function CoachBookingsPanel() {
  const { data, isLoading } = useMyBookings();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [search, setSearch] = useState('');

  const asCoach = data?.asCoach ?? [];

  const counts = useMemo(() => {
    const map: Record<Tab, number> = {
      upcoming: 0,
      pending: 0,
      history: 0,
      cancelled: 0,
      all: asCoach.length,
    };
    for (const b of asCoach) {
      for (const t of TABS) {
        if (t.id !== 'all' && matchTab(b.status, b.startsAt, t.id)) map[t.id] += 1;
      }
    }
    return map;
  }, [asCoach]);

  const filtered = useMemo(() => {
    let rows = asCoach.filter((b) => matchTab(b.status, b.startsAt, tab));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((b) => b.client?.username.toLowerCase().includes(q));
    }
    return rows.sort((a, b) =>
      tab === 'history' || tab === 'cancelled'
        ? new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
        : new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }, [asCoach, tab, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (asCoach.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-7 w-7" />}
        title="Aucune réservation"
        description="Ouvre des créneaux pour attirer les joueurs."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <span className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              Réservations
            </span>
          </CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              className="w-56 pl-9"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium',
                tab === t.id
                  ? 'bg-primary/15 text-primary-200'
                  : 'text-muted hover:text-foreground',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px]',
                  tab === t.id ? 'bg-primary/30' : 'bg-surface',
                )}
              >
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState title="Aucune réservation dans cette catégorie" />
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => (
              <BookingRow key={b.id} booking={b} perspective="coach" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
