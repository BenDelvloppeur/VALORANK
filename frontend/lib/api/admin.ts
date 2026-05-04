'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AdminCoach,
  AdminReview,
  AdminStats,
  Booking,
  BookingStatus,
  CoachProfile,
  Message,
  PlatformSettings,
  Role,
  TimeseriesPoint,
  TopCoach,
  User,
} from '@/types';

export interface AdminConversation extends Booking {
  messages: (Message & { sender?: { username: string } })[];
  _count: { messages: number };
}

// ── USERS ────────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api<User[]>('/admin/users'),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api<User>(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api<{ ok: true }>(`/admin/users/${id}/reset-password`, {
        method: 'POST',
        body: { password },
      }),
  });
}

// ── COACHES ──────────────────────────────────────────────────────────────────

export function useAdminCoaches() {
  return useQuery({
    queryKey: ['admin', 'coaches'],
    queryFn: () => api<AdminCoach[]>('/admin/coaches'),
  });
}

export function useDeleteCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/admin/coaches/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

export function useToggleFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      api<CoachProfile>(`/admin/coaches/${id}/featured`, {
        method: 'PATCH',
        body: { featured },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
      qc.invalidateQueries({ queryKey: ['coach'] });
    },
  });
}

export interface UpdateCoachInput {
  rank?: string;
  description?: string;
  hourlyRate?: number;
  specialties?: string[];
  featured?: boolean;
}

export function useUpdateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoachInput }) =>
      api<CoachProfile>(`/admin/coaches/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
      qc.invalidateQueries({ queryKey: ['coach'] });
    },
  });
}

// ── BOOKINGS ─────────────────────────────────────────────────────────────────

export function useAdminConversations() {
  return useQuery({
    queryKey: ['admin', 'conversations'],
    queryFn: () => api<AdminConversation[]>('/admin/conversations'),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/admin/bookings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['coach'] });
    },
  });
}

export function useAdminUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      api<{ ok: true }>(`/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminRefundBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ ok: true }>(`/admin/bookings/${id}/refund`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

// ── REVIEWS ──────────────────────────────────────────────────────────────────

export function useAdminReviews() {
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => api<AdminReview[]>('/admin/reviews'),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/admin/reviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

// ── STATS / FINANCES ─────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api<AdminStats>('/admin/stats'),
  });
}

export function useTopCoaches() {
  return useQuery({
    queryKey: ['admin', 'top-coaches'],
    queryFn: () => api<TopCoach[]>('/admin/finances/top-coaches'),
  });
}

export function useFinanceTimeseries(days = 30) {
  return useQuery({
    queryKey: ['admin', 'timeseries', days],
    queryFn: () =>
      api<TimeseriesPoint[]>(`/admin/finances/timeseries?days=${days}`),
  });
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api<PlatformSettings>('/admin/settings'),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlatformSettings>) =>
      api<PlatformSettings>('/admin/settings', { method: 'PATCH', body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useRecomputeCommissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input?: { rate?: number; scope?: 'all' | 'paid' }) =>
      api<{ updated: number; rate: number }>(
        '/admin/settings/recompute-commissions',
        { method: 'POST', body: input ?? {} },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}
