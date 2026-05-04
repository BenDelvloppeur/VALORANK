'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  CoachProfile,
  CoachStats,
  CoachClientRow,
  CoachReview,
  TimeseriesPointCoach,
} from '@/types';

export interface CoachFilters {
  rank?: string;
  minPrice?: number;
  maxPrice?: number;
  specialty?: string;
  date?: string;
  search?: string;
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'recent';
}

function buildQuery(filters: CoachFilters): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useCoaches(filters: CoachFilters) {
  return useQuery({
    queryKey: ['coaches', filters],
    queryFn: () => api<CoachProfile[]>(`/coaches${buildQuery(filters)}`, { auth: false }),
  });
}

export function useCoach(id: string | undefined) {
  return useQuery({
    queryKey: ['coach', id],
    enabled: !!id,
    queryFn: () => api<CoachProfile>(`/coaches/${id}`, { auth: false }),
  });
}

export function useCoachStats() {
  return useQuery({
    queryKey: ['coach', 'me', 'stats'],
    queryFn: () => api<CoachStats>('/coaches/me/stats'),
  });
}

export function useCoachTimeseries(days = 30) {
  return useQuery({
    queryKey: ['coach', 'me', 'timeseries', days],
    queryFn: () => api<TimeseriesPointCoach[]>(`/coaches/me/timeseries?days=${days}`),
  });
}

export function useCoachClients() {
  return useQuery({
    queryKey: ['coach', 'me', 'clients'],
    queryFn: () => api<CoachClientRow[]>('/coaches/me/clients'),
  });
}

export function useCoachReviews() {
  return useQuery({
    queryKey: ['coach', 'me', 'reviews'],
    queryFn: () => api<CoachReview[]>('/coaches/me/reviews'),
  });
}

export function useUpdateMyCoachProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CoachProfile> & { avatarUrl?: string }) =>
      api<CoachProfile>('/coaches/me', { method: 'PUT', body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coaches'] });
      qc.invalidateQueries({ queryKey: ['coach'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
