'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Message } from '@/types';

export function useMessages(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['messages', bookingId],
    enabled: !!bookingId,
    queryFn: () => api<Message[]>(`/messages/${bookingId}`),
  });
}

export function useSendMessage(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api<Message>(`/messages/${bookingId}`, { method: 'POST', body: { content } }),
    onSuccess: (msg) => {
      qc.setQueryData<Message[]>(['messages', bookingId], (prev) => {
        if (!prev) return [msg];
        // Évite les doublons en cas de double-write (mutation + realtime)
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
  });
}
