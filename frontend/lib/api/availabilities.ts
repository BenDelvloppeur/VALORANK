'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Availability } from '@/types';

export function useMyAvailabilities() {
  return useQuery({
    queryKey: ['availabilities', 'me'],
    queryFn: () => api<Availability[]>('/availabilities/me'),
  });
}

export function useCreateAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { startsAt: string; endsAt: string }) =>
      api<Availability>('/availabilities', { method: 'POST', body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availabilities', 'me'] });
      qc.invalidateQueries({ queryKey: ['coach'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

export function useBulkAvailabilities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slots: { startsAt: string; endsAt: string }[]) =>
      api<{ created: number; skipped: number }>('/availabilities/bulk', {
        method: 'POST',
        body: { slots },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availabilities', 'me'] });
      qc.invalidateQueries({ queryKey: ['coach'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

export function useDeleteAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/availabilities/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availabilities', 'me'] });
    },
  });
}
