'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Role, User } from '@/types';

interface SyncPayload {
  username: string;
  role: Exclude<Role, 'ADMIN'>;
  avatarUrl?: string;
}

// Wrapper pratique : retourne le user déjà chargé par AuthProvider
// (évite d'avoir 2 fetchs concurrents sur /auth/me).
export function useMe() {
  const { user, loading } = useAuth();
  return { data: user, isLoading: loading };
}

export function useSyncProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SyncPayload) =>
      api<User>('/auth/sync', { method: 'POST', body: payload }),
    onSuccess: () => {
      // On invalide pour que AuthProvider refetche /auth/me et capte le profil.
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
