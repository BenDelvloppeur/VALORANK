'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateReview } from '@/lib/api/reviews';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StarRating } from '@/components/coach/StarRating';

interface ReviewFormProps {
  bookingId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const create = useCreateReview();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Choisis une note');
      return;
    }
    try {
      await create.mutateAsync({ bookingId, rating, comment: comment.trim() || undefined });
      toast.success('Merci pour ton avis !');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <span className="text-xs font-medium text-muted">Ta note</span>
        <div className="mt-1">
          <StarRating value={rating} onChange={setRating} size={24} />
        </div>
      </div>
      <Textarea
        label="Commentaire (optionnel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Qu’as-tu retenu de cette session ?"
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={create.isPending}>
          Publier mon avis
        </Button>
      </div>
    </form>
  );
}
