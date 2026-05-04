'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCoach } from '@/lib/api/coaches';
import { Avatar } from '@/components/coach/Avatar';
import { RankBadge } from '@/components/coach/RankBadge';
import { StarRating } from '@/components/coach/StarRating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { AvailabilityList } from '@/components/booking/AvailabilityList';
import { ReviewList } from '@/components/reviews/ReviewList';
import { formatPrice, specialtyLabel } from '@/lib/utils/valorant';
import { Calendar, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CoachProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const { data: coach, isLoading, error } = useCoach(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Coach introuvable" description="Ce profil n’existe pas ou a été supprimé." />
      </div>
    );
  }

  const username = coach.user?.username ?? 'Coach';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      {/* HERO PROFIL */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6 sm:p-8"
      >
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <Avatar
            src={coach.user?.avatarUrl ?? null}
            username={username}
            size={120}
            className="ring-4 ring-primary/20"
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl sm:text-4xl">{username}</h1>
              <RankBadge rank={coach.rank} />
            </div>
            <div className="flex items-center gap-3">
              <StarRating value={coach.rating} size={18} showValue />
              <span className="text-sm text-muted">
                {coach.reviewsCount} avis
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {coach.specialties.map((s) => (
                <Badge key={s} variant="accent">
                  <Sparkles className="h-3 w-3" />
                  {specialtyLabel(s)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col items-end gap-3 sm:w-auto">
            <div className="text-right">
              <div className="font-display text-3xl text-primary">
                {formatPrice(coach.hourlyRate)}
              </div>
              <div className="text-xs uppercase tracking-wider text-muted">/ heure</div>
            </div>
            <Link href={`/booking/${coach.id}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Réserver
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>À propos du coach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {coach.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted" />
                <CardTitle>Avis ({coach.reviewsCount})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ReviewList reviews={coach.reviews ?? []} />
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-20 lg:self-start">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" />
              <CardTitle>Créneaux disponibles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AvailabilityList availabilities={coach.availabilities ?? []} />
            <Link href={`/booking/${coach.id}`} className="mt-5 block">
              <Button variant="primary" className="w-full">
                Choisir un créneau
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
