import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/coach/Avatar';
import { formatTimeOnly } from '@/lib/utils/dates';
import { ShieldCheck } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const isAdmin = message.sender?.role === 'ADMIN';

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isMine ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <Avatar
        src={message.sender?.avatarUrl ?? null}
        username={message.sender?.username ?? '?'}
        size={28}
        className={isAdmin ? 'ring-2 ring-warning/60' : undefined}
      />
      <div className="flex max-w-[80%] flex-col gap-1">
        {/* Bandeau "Modération" pour les messages d'admin */}
        {isAdmin && (
          <div
            className={cn(
              'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warning',
              isMine ? 'self-end' : 'self-start',
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            Modération · {message.sender?.username}
          </div>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm',
            isAdmin
              ? 'border border-warning/40 bg-warning/10 text-warning rounded-tl-sm rounded-tr-sm'
              : isMine
                ? 'rounded-br-sm bg-primary text-white'
                : 'rounded-bl-sm bg-surface-2 text-foreground',
          )}
        >
          <p className="whitespace-pre-line">{message.content}</p>
          <div
            className={cn(
              'mt-1 text-[10px]',
              isAdmin
                ? 'text-warning/70'
                : isMine
                  ? 'text-white/70'
                  : 'text-muted',
            )}
          >
            {formatTimeOnly(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
