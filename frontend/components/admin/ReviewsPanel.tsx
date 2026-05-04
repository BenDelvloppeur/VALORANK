'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MessageCircle, Star, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/coach/Avatar';
import { StarRating } from '@/components/coach/StarRating';
import { useAdminReviews, useDeleteReview } from '@/lib/api/admin';
import { formatShort } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5';

export function ReviewsPanel() {
  const { data, isLoading } = useAdminReviews();
  const deleteReview = useDeleteReview();
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState<RatingFilter>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data;
    if (rating !== 'all') rows = rows.filter((r) => r.rating === Number(rating));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.author?.username.toLowerCase().includes(q) ||
          r.coach?.user?.username.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, search, rating]);

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet avis ? La note moyenne du coach sera recalculée.')) return;
    try {
      await deleteReview.mutateAsync(id);
      toast.success('Avis supprimé');
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
        icon={<MessageCircle className="h-7 w-7" />}
        title="Aucun avis"
        description="Les avis des clients apparaîtront ici dès qu'ils seront publiés."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Avis ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Auteur, coach, commentaire…"
                className="w-64 pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
              {(['all', '5', '4', '3', '2', '1'] as RatingFilter[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                    rating === r
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
          <EmptyState title="Aucun avis pour ce filtre" />
        ) : (
          <ul className="space-y-2">
            {filtered.map((rev) => (
              <li
                key={rev.id}
                className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-surface-2 p-4"
              >
                <Avatar
                  src={rev.author?.avatarUrl ?? null}
                  username={rev.author?.username ?? '?'}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{rev.author?.username}</span>
                    <span className="text-xs text-muted">→</span>
                    <span className="text-sm font-medium">{rev.coach?.user?.username}</span>
                    <StarRating value={rev.rating} size={14} />
                    <span className="text-xs text-muted">{formatShort(rev.createdAt)}</span>
                  </div>
                  {rev.comment ? (
                    <p className="mt-1 text-sm text-foreground/80">{rev.comment}</p>
                  ) : (
                    <p className="mt-1 text-xs italic text-muted">Pas de commentaire</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(rev.id)}
                  title="Supprimer cet avis"
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
