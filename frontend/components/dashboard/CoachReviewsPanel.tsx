'use client';

import { useMemo, useState } from 'react';
import { MessageCircle, Star, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/coach/Avatar';
import { StarRating } from '@/components/coach/StarRating';
import { useCoachReviews, useCoachStats } from '@/lib/api/coaches';
import { formatShort } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5';

export function CoachReviewsPanel() {
  const { data: stats } = useCoachStats();
  const { data: reviews, isLoading } = useCoachReviews();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RatingFilter>('all');

  const filtered = useMemo(() => {
    if (!reviews) return [];
    let rows = reviews;
    if (filter !== 'all') rows = rows.filter((r) => r.rating === Number(filter));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.author.username.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [reviews, filter, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-7 w-7" />}
        title="Pas encore d'avis"
        description="Tes premiers avis arriveront après tes premières sessions terminées."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Synthèse */}
      {stats && stats.reviews.count > 0 && (
        <Card>
          <CardContent className="grid items-center gap-6 py-6 sm:grid-cols-[200px_1fr]">
            <div className="text-center">
              <div className="text-5xl font-bold text-gold">
                {stats.reviews.avg.toFixed(1)}
              </div>
              <StarRating
                value={stats.reviews.avg}
                size={18}
                className="mt-2 justify-center"
              />
              <div className="mt-1 text-xs text-muted">
                {stats.reviews.count} avis reçus
              </div>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rate) => {
                const count = stats.reviews.distribution[rate as 1 | 2 | 3 | 4 | 5];
                const pct = stats.reviews.count
                  ? Math.round((count / stats.reviews.count) * 100)
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Tous les avis ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-56 pl-9"
                />
              </div>
              <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
                {(['all', '5', '4', '3', '2', '1'] as RatingFilter[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFilter(r)}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                      filter === r
                        ? 'bg-primary/15 text-primary-200'
                        : 'text-muted hover:text-foreground',
                    )}
                  >
                    {r === 'all' ? 'Tous' : (
                      <>
                        {r}
                        <Star className="h-3 w-3 fill-current text-gold" />
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState title="Aucun avis ne correspond à ce filtre" />
          ) : (
            <ul className="space-y-3">
              {filtered.map((rev) => (
                <li
                  key={rev.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-4"
                >
                  <Avatar
                    src={rev.author.avatarUrl ?? null}
                    username={rev.author.username}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{rev.author.username}</span>
                      <StarRating value={rev.rating} size={14} />
                      <span className="text-xs text-muted">
                        {formatShort(rev.createdAt)} • session du{' '}
                        {formatShort(rev.booking.startsAt)}
                      </span>
                    </div>
                    {rev.comment ? (
                      <p className="mt-1 text-sm text-foreground/85">{rev.comment}</p>
                    ) : (
                      <p className="mt-1 text-xs italic text-muted">Pas de commentaire</p>
                    )}
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
