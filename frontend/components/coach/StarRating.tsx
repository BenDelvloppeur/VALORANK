'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  showValue?: boolean;
  className?: string;
}

// Affichage seul si onChange n'est pas fourni, sinon interactif.
export function StarRating({
  value,
  onChange,
  size = 16,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = !!onChange;
  const display = hover ?? value;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n;
        const half = !filled && display >= n - 0.5;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={interactive ? () => setHover(n) : undefined}
            onMouseLeave={interactive ? () => setHover(null) : undefined}
            onClick={interactive ? () => onChange?.(n) : undefined}
            className={cn(
              'transition-transform',
              interactive && 'hover:scale-110',
            )}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={cn(
                filled
                  ? 'fill-gold text-gold'
                  : half
                    ? 'fill-gold/50 text-gold'
                    : 'text-muted/40',
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-foreground">
          {value > 0 ? value.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}
