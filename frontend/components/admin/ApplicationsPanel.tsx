'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  useAdminApplications,
  useReviewApplication,
} from '@/lib/api/applications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/coach/Avatar';
import { RankBadge } from '@/components/coach/RankBadge';
import { Dialog } from '@/components/ui/Dialog';
import { formatPrice, specialtyLabel, type ValorantRank } from '@/lib/utils/valorant';
import { formatShort, relative } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import type { ApplicationStatus, CoachApplication } from '@/types';

const FILTERS: { id: 'all' | ApplicationStatus; label: string }[] = [
  { id: 'PENDING', label: 'En attente' },
  { id: 'APPROVED', label: 'Approuvées' },
  { id: 'REJECTED', label: 'Refusées' },
  { id: 'all', label: 'Toutes' },
];

export function ApplicationsPanel() {
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [reviewing, setReviewing] = useState<{
    application: CoachApplication;
    decision: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data, isLoading } = useAdminApplications(
    filter === 'all' ? undefined : (filter as ApplicationStatus),
  );
  const review = useReviewApplication();

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (a) =>
        a.user?.username.toLowerCase().includes(q) ||
        a.user?.email.toLowerCase().includes(q),
    );
  }, [data, search]);

  async function submitReview() {
    if (!reviewing) return;
    try {
      await review.mutateAsync({
        id: reviewing.application.id,
        status: reviewing.decision,
        reviewNote: reviewNote.trim() || undefined,
      });
      toast.success(
        reviewing.decision === 'APPROVED'
          ? `${reviewing.application.user?.username} est désormais coach 🎉`
          : 'Candidature refusée',
      );
      setReviewing(null);
      setReviewNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-400" />
                Candidatures coach ({filtered.length})
              </span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pseudo, email…"
                  className="w-56 pl-9"
                />
              </div>
              <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-medium',
                      filter === f.id
                        ? 'bg-primary/15 text-primary-200'
                        : 'text-muted hover:text-foreground',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-7 w-7" />}
              title="Aucune candidature"
              description="Quand un client postulera, sa candidature apparaîtra ici."
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map((app) => (
                <li
                  key={app.id}
                  className={cn(
                    'rounded-lg border bg-surface-2 p-5',
                    app.status === 'PENDING' && 'border-warning/40',
                    app.status === 'APPROVED' && 'border-success/40',
                    app.status === 'REJECTED' && 'border-danger/40',
                    !['PENDING', 'APPROVED', 'REJECTED'].includes(app.status) &&
                      'border-border',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar
                      src={app.user?.avatarUrl ?? null}
                      username={app.user?.username ?? '?'}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {app.user?.username}
                        </span>
                        <span className="text-xs text-muted">{app.user?.email}</span>
                        <StatusBadge status={app.status} />
                        <RankBadge rank={app.rank as ValorantRank} size="sm" />
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        Soumise {relative(app.createdAt)}{' '}
                        {app.reviewedAt && (
                          <>
                            • Traitée {relative(app.reviewedAt)} par{' '}
                            {app.reviewedBy?.username ?? '—'}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted">Tarif demandé</div>
                      <div className="text-lg font-bold">
                        {formatPrice(app.hourlyRate)}/h
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-wide text-muted">
                          Description
                        </div>
                        <p className="rounded-md border border-border bg-surface p-3 text-sm">
                          {app.description}
                        </p>
                      </div>
                      {app.experience && (
                        <div>
                          <div className="mb-1 text-xs uppercase tracking-wide text-muted">
                            Expérience
                          </div>
                          <p className="rounded-md border border-border bg-surface p-3 text-sm">
                            {app.experience}
                          </p>
                        </div>
                      )}
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-wide text-muted">
                          Spécialités
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {app.specialties.map((s) => (
                            <Badge key={s}>{specialtyLabel(s)}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-wide text-muted">
                          Preuves
                        </div>
                        <div className="space-y-2">
                          {app.trackerUrl ? (
                            <a
                              href={app.trackerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-surface-2"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-primary" />
                              <span className="truncate text-primary-200">
                                tracker.gg
                              </span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Pas de lien tracker
                            </div>
                          )}
                          {app.screenshotUrl ? (
                            <a
                              href={app.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block overflow-hidden rounded-md border border-border bg-surface hover:border-primary/40"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={app.screenshotUrl}
                                alt="Capture du rang"
                                className="h-32 w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Pas de capture
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {app.reviewNote && (
                    <div className="mt-3 rounded-md border border-border bg-surface p-3 text-xs">
                      <strong className="text-foreground">Note admin :</strong>{' '}
                      <span className="text-muted">{app.reviewNote}</span>
                    </div>
                  )}

                  {app.status === 'PENDING' && (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewing({ application: app, decision: 'REJECTED' });
                          setReviewNote('');
                        }}
                      >
                        <XCircle className="h-3.5 w-3.5 text-danger" />
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setReviewing({ application: app, decision: 'APPROVED' });
                          setReviewNote('');
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approuver
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={
          reviewing?.decision === 'APPROVED'
            ? `Approuver ${reviewing.application.user?.username} ?`
            : `Refuser ${reviewing?.application.user?.username ?? ''} ?`
        }
        description={
          reviewing?.decision === 'APPROVED'
            ? "Le user passera en COACH et un profil sera créé à partir de la candidature."
            : "Le candidat pourra retravailler son dossier et soumettre à nouveau."
        }
      >
        <div className="space-y-4">
          {reviewing && reviewing.decision === 'APPROVED' && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
              <strong className="text-success">Récap de l'approbation</strong>
              <div className="mt-2 grid gap-1 text-xs text-muted">
                <div>• Rang : {reviewing.application.rank}</div>
                <div>
                  • Tarif : {formatPrice(reviewing.application.hourlyRate)}/h
                </div>
                <div>
                  • Spécialités :{' '}
                  {reviewing.application.specialties
                    .map((s) => specialtyLabel(s))
                    .join(', ')}
                </div>
                <div>
                  • Soumis le :{' '}
                  {formatShort(reviewing.application.createdAt)}
                </div>
              </div>
            </div>
          )}
          <Textarea
            label={
              reviewing?.decision === 'APPROVED'
                ? 'Note interne (optionnel)'
                : 'Raison du refus (optionnel mais recommandé)'
            }
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={4}
            placeholder={
              reviewing?.decision === 'APPROVED'
                ? "Bienvenue dans l'équipe ! …"
                : 'Le rang affiché ne correspond pas à la capture / Description trop courte …'
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReviewing(null)}>
              Annuler
            </Button>
            <Button
              variant={reviewing?.decision === 'APPROVED' ? 'primary' : 'danger'}
              onClick={submitReview}
              loading={review.isPending}
            >
              {reviewing?.decision === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Approuver
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" /> Refuser
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === 'PENDING')
    return (
      <Badge variant="warning">
        <Clock className="h-3 w-3" /> En attente
      </Badge>
    );
  if (status === 'APPROVED')
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" /> Approuvée
      </Badge>
    );
  return (
    <Badge variant="danger">
      <XCircle className="h-3 w-3" /> Refusée
    </Badge>
  );
}
