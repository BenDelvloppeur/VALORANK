'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CoachProfile } from '@/types';
import { Avatar } from './Avatar';
import { RankBadge } from './RankBadge';
import { StarRating } from './StarRating';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, specialtyLabel } from '@/lib/utils/valorant';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CoachCardProps {
  coach: CoachProfile;
}

export function CoachCard({ coach }: CoachCardProps) {
  const username = coach.user?.username ?? 'Coach';
  const featured = coach.featured;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="relative"
    >
      {/* Halo doré animé pour les coachs featured */}
      {featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold opacity-60 blur-sm"
        />
      )}

      <Link
        href={`/coaches/${coach.id}`}
        className={cn(
          'group relative flex h-full flex-col gap-4 rounded-xl border bg-surface p-5 transition-all',
          featured
            ? 'border-gold/70 shadow-[0_0_0_1px_rgba(255,200,87,0.4),0_8px_30px_-10px_rgba(255,200,87,0.45)] hover:shadow-[0_0_0_1px_rgba(255,200,87,0.7),0_8px_36px_-8px_rgba(255,200,87,0.6)]'
            : 'border-border hover:border-primary/50 hover:shadow-glow',
        )}
      >
        {/* Badge "Recommandé" pour featured */}
        {featured && (
          <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-gold to-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-lg">
            <Sparkles className="h-3 w-3" />
            Recommandé
          </div>
        )}

        <div className="flex items-start gap-4">
          <Avatar
            src={coach.user?.avatarUrl ?? null}
            username={username}
            size={56}
            className={cn(
              'ring-2 transition-all',
              featured
                ? 'ring-gold/60 group-hover:ring-gold'
                : 'ring-border group-hover:ring-primary/40',
            )}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-lg leading-tight">{username}</h3>
            </div>
            <RankBadge rank={coach.rank} size="sm" />
            <div className="flex items-center gap-2 pt-1">
              <StarRating value={coach.rating} size={14} />
              <span className="text-xs text-muted">({coach.reviewsCount})</span>
            </div>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-lg font-semibold',
                featured ? 'text-gold' : 'text-primary',
              )}
            >
              {formatPrice(coach.hourlyRate)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted">/ heure</div>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted">{coach.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {coach.specialties.slice(0, 4).map((s) => (
            <Badge key={s} variant="accent">
              {specialtyLabel(s)}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted">Voir le profil</span>
          <ArrowRight
            className={cn(
              'h-4 w-4 transition-transform group-hover:translate-x-1',
              featured ? 'text-gold' : 'text-primary',
            )}
          />
        </div>
      </Link>
    </motion.div>
  );
}
