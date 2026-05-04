import type { Review } from '@/types';
import { Avatar } from '@/components/coach/Avatar';
import { StarRating } from '@/components/coach/StarRating';
import { relative } from '@/lib/utils/dates';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (!reviews.length) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-7 w-7" />}
        title="Aucun avis pour l’instant"
        description="Sois le premier à laisser ton retour après une session."
      />
    );
  }
  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-border bg-surface-2 p-4"
        >
          <div className="flex items-start gap-3">
            <Avatar
              src={r.author?.avatarUrl ?? null}
              username={r.author?.username ?? '?'}
              size={36}
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.author?.username ?? 'Anonyme'}</span>
                <span className="text-xs text-muted">{relative(r.createdAt)}</span>
              </div>
              <StarRating value={r.rating} size={14} />
              {r.comment && <p className="text-sm text-foreground/90">{r.comment}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
