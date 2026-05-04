'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Review } from '@/types';

export function useCoachReviews(coachId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'coach', coachId],
    enabled: !!coachId,
    queryFn: () => api<Review[]>(`/reviews/coach/${coachId}`, { auth: false }),
  });
}

interface CreateReview {
  bookingId: string;
  rating: number;
  comment?: string;
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReview) =>
      api<Review>('/reviews', { method: 'POST', body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['coach'] });
    },
  });
}
