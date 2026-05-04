'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useSendMessage } from '@/lib/api/messages';
import { supabase } from '@/lib/supabase/client';
import { useMe } from '@/lib/api/auth';
import { MessageBubble } from './MessageBubble';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Send } from 'lucide-react';

interface ChatWindowProps {
  bookingId: string;
  /** Affiche un bandeau "intervention modération" au-dessus de la zone de saisie */
  moderationMode?: boolean;
}

// Affiche les messages d'une réservation et s'abonne aux nouveaux INSERTs
// via Supabase Realtime (table `Message`, filtre bookingId).
export function ChatWindow({ bookingId, moderationMode = false }: ChatWindowProps) {
  const { data: me } = useMe();
  const { data: messages, isLoading } = useMessages(bookingId);
  const send = useSendMessage(bookingId);
  const qc = useQueryClient();

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages?.length]);

  // Subscription Supabase Realtime — INSERT sur Message filtré par bookingId.
  // Le payload realtime ne contient pas le sender joint (avatar/role),
  // donc on refetch via React Query pour récupérer les données complètes.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `bookingId=eq.${bookingId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['messages', bookingId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, qc]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      await send.mutateAsync(trimmed);
    } catch {
      setText(trimmed);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-border bg-surface">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : !messages || messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            Pas encore de message. Lance la conversation.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isMine={m.senderId === me?.id} />
          ))
        )}
      </div>

      {moderationMode && (
        <div className="flex items-center justify-center gap-2 border-t border-warning/30 bg-warning/10 px-3 py-1.5 text-xs text-warning">
          <span className="font-medium">⚠ Intervention modération</span>
          <span className="text-warning/80">
            Tes messages apparaîtront avec un badge "Modération"
          </span>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            moderationMode
              ? 'Intervention modération…'
              : 'Écris un message…'
          }
          maxLength={2000}
        />
        <Button type="submit" size="icon" loading={send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
