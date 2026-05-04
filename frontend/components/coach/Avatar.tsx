import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: number;
  className?: string;
}

// Image utilisateur avec fallback sur initiales colorées.
export function Avatar({ src, username, size = 48, className }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();
  if (!src) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-accent/40 font-semibold text-white',
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={username}
      width={size}
      height={size}
      unoptimized
      className={cn('rounded-full bg-surface object-cover', className)}
      style={{ width: size, height: size }}
    />
  );
}
