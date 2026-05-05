'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  ApplicationInput,
  ApplicationStatus,
  CoachApplication,
} from '@/types';

// ─── Côté candidat ──────────────────────────────────────────────────────────

export function useMyApplication(enabled = true) {
  return useQuery({
    queryKey: ['application', 'me'],
    enabled,
    retry: false,
    queryFn: () => api<CoachApplication | null>('/applications/me'),
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplicationInput) =>
      api<CoachApplication>('/applications', { method: 'POST', body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application'] });
    },
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/applications/me', { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application'] }),
  });
}

// ─── Côté admin ─────────────────────────────────────────────────────────────

export function useAdminApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: ['admin', 'applications', status ?? 'all'],
    queryFn: () =>
      api<CoachApplication[]>(
        `/admin/applications${status ? `?status=${status}` : ''}`,
      ),
  });
}

export function useReviewApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
      reviewNote?: string;
    }) =>
      api<{ ok: true }>(`/admin/applications/${id}`, {
        method: 'PATCH',
        body: { status, reviewNote },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
