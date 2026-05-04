import { cn } from '@/lib/utils/cn';
import { RANK_COLORS, RANK_LABELS, type ValorantRank } from '@/lib/utils/valorant';
import { Trophy } from 'lucide-react';

interface RankBadgeProps {
  rank: ValorantRank;
  className?: string;
  size?: 'sm' | 'md';
}

export function RankBadge({ rank, className, size = 'md' }: RankBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/10 font-semibold uppercase tracking-wide',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        RANK_COLORS[rank],
        className,
      )}
    >
      <Trophy className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {RANK_LABELS[rank]}
    </span>
  );
}
