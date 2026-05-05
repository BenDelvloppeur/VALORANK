'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crosshair,
  Crown,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useMe } from '@/lib/api/auth';
import {
  useMyApplication,
  useSubmitApplication,
  useWithdrawApplication,
} from '@/lib/api/applications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';
import { RankBadge } from '@/components/coach/RankBadge';
import {
  RANK_LABELS,
  SPECIALTIES,
  VALORANT_RANKS,
  formatPrice,
  type ValorantRank,
} from '@/lib/utils/valorant';
import { cn } from '@/lib/utils/cn';
import { formatShort } from '@/lib/utils/dates';

const STEPS = [
  { id: 1, title: 'Présentation', icon: Sparkles },
  { id: 2, title: 'Ton niveau', icon: Trophy },
  { id: 3, title: 'Ton offre', icon: Crown },
  { id: 4, title: 'Confirmation', icon: CheckCircle2 },
];

export default function BecomeCoachPage() {
  const router = useRouter();
  const { session, needsProfile } = useAuth();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: existing, isLoading: appLoading } = useMyApplication();

  // ── Hooks d'état du wizard ──────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [rank, setRank] = useState<ValorantRank>('DIAMOND');
  const [trackerUrl, setTrackerUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRateEur, setHourlyRateEur] = useState(25);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [showResubmit, setShowResubmit] = useState(false);

  const submit = useSubmitApplication();
  const withdraw = useWithdrawApplication();

  useEffect(() => {
    // Pré-remplit le formulaire à partir d'une candidature existante.
    if (existing) {
      setRank(existing.rank as ValorantRank);
      setTrackerUrl(existing.trackerUrl ?? '');
      setScreenshotUrl(existing.screenshotUrl ?? '');
      setDescription(existing.description);
      setExperience(existing.experience ?? '');
      setHourlyRateEur(Math.round(existing.hourlyRate / 100));
      setSpecialties(existing.specialties);
    }
  }, [existing]);

  if (meLoading || appLoading) return <FullPageSpinner />;

  // ── Cas non connecté → propose de se connecter / créer un compte ─────────
  if (!session) {
    return <SignedOutInvite />;
  }

  // ── Cas profil incomplet ─────────────────────────────────────────────────
  if (needsProfile) {
    return (
      <CenterCard
        icon={<Sparkles className="h-7 w-7 text-accent-400" />}
        title="Complète d'abord ton profil"
        description="On a besoin de ton pseudo avant que tu puisses postuler comme coach."
        action={
          <Link href="/complete-profile">
            <Button>Compléter mon profil</Button>
          </Link>
        }
      />
    );
  }

  // ── Cas user déjà coach ──────────────────────────────────────────────────
  if (me?.role === 'COACH' || me?.role === 'ADMIN') {
    return (
      <CenterCard
        icon={<Crown className="h-7 w-7 text-gold" />}
        title="Tu es déjà coach"
        description="Pas besoin de candidater — accède directement à ton dashboard pour gérer tes sessions."
        action={
          <Link href="/dashboard">
            <Button>Aller sur mon dashboard</Button>
          </Link>
        }
      />
    );
  }

  // ── Cas candidature existante ───────────────────────────────────────────
  if (existing && !showResubmit) {
    return (
      <ApplicationStatusView
        application={existing}
        onResubmit={() => {
          setShowResubmit(true);
          setStep(2);
        }}
        onWithdraw={async () => {
          if (!confirm('Retirer ta candidature ?')) return;
          try {
            await withdraw.mutateAsync();
            toast.success('Candidature retirée');
            router.push('/');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur');
          }
        }}
      />
    );
  }

  function toggleSpecialty(id: string) {
    setSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function canGoNext(): { ok: boolean; reason?: string } {
    if (step === 2) {
      if (!rank) return { ok: false, reason: 'Choisis ton rang' };
      if (!trackerUrl && !screenshotUrl) {
        return {
          ok: false,
          reason: 'Renseigne ton lien tracker.gg ou une capture d\'écran',
        };
      }
    }
    if (step === 3) {
      if (description.trim().length < 50) {
        return { ok: false, reason: 'Décris-toi en au moins 50 caractères' };
      }
      if (specialties.length === 0) {
        return { ok: false, reason: 'Choisis au moins une spécialité' };
      }
      if (hourlyRateEur < 5 || hourlyRateEur > 500) {
        return { ok: false, reason: 'Tarif entre 5 et 500 €/h' };
      }
    }
    return { ok: true };
  }

  async function handleSubmit() {
    try {
      await submit.mutateAsync({
        rank,
        trackerUrl: trackerUrl || undefined,
        screenshotUrl: screenshotUrl || undefined,
        description,
        experience: experience || undefined,
        hourlyRate: hourlyRateEur * 100,
        specialties,
      });
      toast.success('Candidature envoyée !');
      setShowResubmit(false);
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <Crosshair className="mx-auto mb-3 h-8 w-8 text-primary" />
        <h1 className="font-display text-3xl sm:text-4xl">Devenir coach Valorank</h1>
        <p className="mt-2 text-muted">
          Quelques étapes pour postuler — un admin examinera ta candidature sous 24-48h.
        </p>
      </div>

      {/* Stepper */}
      <Stepper current={step} onJump={(s) => s < step && setStep(s)} />

      {/* Steps content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && <StepIntro onStart={() => setStep(2)} />}
            {step === 2 && (
              <StepLevel
                rank={rank}
                setRank={setRank}
                trackerUrl={trackerUrl}
                setTrackerUrl={setTrackerUrl}
                screenshotUrl={screenshotUrl}
                setScreenshotUrl={setScreenshotUrl}
              />
            )}
            {step === 3 && (
              <StepOffer
                description={description}
                setDescription={setDescription}
                experience={experience}
                setExperience={setExperience}
                hourlyRateEur={hourlyRateEur}
                setHourlyRateEur={setHourlyRateEur}
                specialties={specialties}
                toggleSpecialty={toggleSpecialty}
              />
            )}
            {step === 4 && (
              <StepConfirm
                rank={rank}
                trackerUrl={trackerUrl}
                screenshotUrl={screenshotUrl}
                description={description}
                experience={experience}
                hourlyRateEur={hourlyRateEur}
                specialties={specialties}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      {step > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={submit.isPending}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => {
                const r = canGoNext();
                if (!r.ok) {
                  toast.error(r.reason ?? 'Champ manquant');
                  return;
                }
                setStep((s) => Math.min(4, s + 1));
              }}
            >
              Étape suivante
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submit.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              Envoyer ma candidature
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────

function Stepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (step: number) => void;
}) {
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((s) => {
        const Icon = s.icon;
        const active = current === s.id;
        const passed = current > s.id;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onJump(s.id)}
              disabled={!passed}
              className={cn(
                'group flex w-full flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all',
                active
                  ? 'border-primary/60 bg-primary/10'
                  : passed
                    ? 'border-success/40 bg-success/5 hover:bg-success/10'
                    : 'border-border bg-surface opacity-60',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  active
                    ? 'bg-primary/20 text-primary-200'
                    : passed
                      ? 'bg-success/20 text-success'
                      : 'bg-surface-2 text-muted',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium">
                Étape {s.id}
                <span className="hidden sm:inline"> · {s.title}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Step 1 : intro ───────────────────────────────────────────────────────

function StepIntro({ onStart }: { onStart: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div className="text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-accent-400" />
          <h2 className="font-display text-2xl">Pourquoi rejoindre Valorank ?</h2>
          <p className="mt-2 text-muted">
            On rassemble des joueurs sérieux et on te connecte à eux. Tu fixes ton tarif, tu
            pilotes tes créneaux, on s'occupe du reste.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Perk
            icon={<Zap className="h-5 w-5" />}
            title="Liberté totale"
            desc="Tu choisis ton tarif, ton planning, tes spécialités."
          />
          <Perk
            icon={<Trophy className="h-5 w-5" />}
            title="Audience qualifiée"
            desc="Joueurs réellement motivés à progresser."
          />
          <Perk
            icon={<Crown className="h-5 w-5" />}
            title="Mise en avant"
            desc="Les meilleurs coachs sont propulsés en page d'accueil."
          />
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          <strong className="text-foreground">Ce dont on a besoin :</strong> ton rang Valorant
          actuel + une preuve (tracker.gg ou capture d'écran), une description de ce que tu
          enseignes, et tes spécialités. Ça prend 3 minutes.
        </div>

        <div className="flex justify-center">
          <Button size="lg" onClick={onStart}>
            Commencer
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Perk({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted">{desc}</p>
    </div>
  );
}

// ─── Step 2 : niveau ──────────────────────────────────────────────────────

function StepLevel({
  rank,
  setRank,
  trackerUrl,
  setTrackerUrl,
  screenshotUrl,
  setScreenshotUrl,
}: {
  rank: ValorantRank;
  setRank: (r: ValorantRank) => void;
  trackerUrl: string;
  setTrackerUrl: (s: string) => void;
  screenshotUrl: string;
  setScreenshotUrl: (s: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            Ton niveau de jeu
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">
            Rang Valorant actuel
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {VALORANT_RANKS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRank(r)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-all',
                  rank === r
                    ? 'border-primary bg-primary/15 text-primary-200'
                    : 'border-border bg-surface-2 text-muted hover:border-border/80',
                )}
              >
                {RANK_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Preuve du niveau</div>
          <p className="text-xs text-muted">
            Donne au moins une preuve : ton lien tracker.gg <em>ou</em> une capture d'écran de
            ton rang en jeu (uploadée sur Imgur, Discord, etc., et colle l'URL ici).
          </p>

          <div className="space-y-2">
            <Input
              label="Lien tracker.gg"
              type="url"
              value={trackerUrl}
              onChange={(e) => setTrackerUrl(e.target.value)}
              placeholder="https://tracker.gg/valorant/profile/riot/Pseudo%23TAG"
            />
            <a
              href="https://tracker.gg/valorant"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-200 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Trouver mon profil sur tracker.gg
            </a>
          </div>

          <div className="space-y-2">
            <Input
              label="URL de la capture d'écran"
              type="url"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="https://i.imgur.com/…"
            />
            {screenshotUrl && (
              <div className="overflow-hidden rounded-lg border border-border bg-surface-2 p-2">
                <p className="mb-2 flex items-center gap-2 text-xs text-muted">
                  <Camera className="h-3 w-3" />
                  Aperçu de ta capture
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt="Capture du rang"
                  className="max-h-64 w-full rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            {!screenshotUrl && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <ImageIcon className="h-3 w-3" />
                Tu n'as pas d'hébergeur ? Drag & drop ton screen sur{' '}
                <a
                  href="https://imgur.com/upload"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-200 hover:underline"
                >
                  imgur.com/upload
                </a>{' '}
                puis copie l'URL de l'image.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 3 : offre coach ─────────────────────────────────────────────────

function StepOffer({
  description,
  setDescription,
  experience,
  setExperience,
  hourlyRateEur,
  setHourlyRateEur,
  specialties,
  toggleSpecialty,
}: {
  description: string;
  setDescription: (s: string) => void;
  experience: string;
  setExperience: (s: string) => void;
  hourlyRateEur: number;
  setHourlyRateEur: (n: number) => void;
  specialties: string[];
  toggleSpecialty: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-accent-400" />
            Ton offre coach
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Textarea
          label="Présente-toi (50 caractères min)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minLength={50}
          maxLength={2000}
          rows={5}
          placeholder="Ex : Diamond 3 stable, ex-membre d'une équipe semi-pro. Je bosse l'aim, le crosshair placement et le mid-round adapt. Pédagogue, j'aime décortiquer les démos."
        />
        <div className="text-right text-xs text-muted">
          {description.length} / 2000
        </div>

        <Textarea
          label="Expérience compétitive (optionnel)"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Tournois disputés, équipes, années de jeu, jeux précédents (CS, Apex, etc.)…"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Tarif horaire (€)"
            type="number"
            min={5}
            max={500}
            value={hourlyRateEur}
            onChange={(e) => setHourlyRateEur(Number(e.target.value))}
          />
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
            <strong className="text-foreground">{formatPrice(hourlyRateEur * 100)}</strong>{' '}
            facturés au client. Tu touches{' '}
            <strong className="text-success">{formatPrice(Math.round(hourlyRateEur * 100 * 0.8))}</strong>{' '}
            net par session (commission plateforme ~20 %).
          </div>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">
            Spécialités (au moins 1)
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => {
              const active = specialties.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSpecialty(s.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-all',
                    active
                      ? 'border-accent bg-accent/15 text-accent-400'
                      : 'border-border bg-surface-2 text-muted hover:border-border/80',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 4 : confirmation ────────────────────────────────────────────────

function StepConfirm(props: {
  rank: ValorantRank;
  trackerUrl: string;
  screenshotUrl: string;
  description: string;
  experience: string;
  hourlyRateEur: number;
  specialties: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Récapitulatif
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Row label="Rang">
          <RankBadge rank={props.rank} />
        </Row>
        <Row label="Preuve tracker.gg">
          {props.trackerUrl ? (
            <a
              href={props.trackerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary-200 hover:underline"
            >
              {props.trackerUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-muted">—</span>
          )}
        </Row>
        <Row label="Capture">
          {props.screenshotUrl ? (
            <a
              href={props.screenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary-200 hover:underline"
            >
              Voir la capture
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-muted">—</span>
          )}
        </Row>
        <Row label="Tarif">
          <strong>{formatPrice(props.hourlyRateEur * 100)}/h</strong>
        </Row>
        <Row label="Spécialités">
          <div className="flex flex-wrap gap-1">
            {props.specialties.map((s) => (
              <Badge key={s}>
                {SPECIALTIES.find((sp) => sp.id === s)?.label ?? s}
              </Badge>
            ))}
          </div>
        </Row>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            Description
          </div>
          <p className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
            {props.description}
          </p>
        </div>
        {props.experience && (
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
              Expérience
            </div>
            <p className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
              {props.experience}
            </p>
          </div>
        )}

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted">
          En envoyant ta candidature, tu acceptes que les admins de Valorank examinent les
          éléments fournis. Tu seras informé du résultat dans les 24-48h.
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

// ─── Vue statut candidature ───────────────────────────────────────────────

function ApplicationStatusView({
  application,
  onResubmit,
  onWithdraw,
}: {
  application: NonNullable<Awaited<ReturnType<typeof useMyApplication>['data']>>;
  onResubmit: () => void;
  onWithdraw: () => void;
}) {
  const status = application.status;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Card>
        <CardContent className="space-y-5 p-8 text-center">
          {status === 'PENDING' && (
            <>
              <Clock className="mx-auto h-12 w-12 text-warning" />
              <h1 className="font-display text-2xl">Candidature en cours d'examen</h1>
              <p className="text-muted">
                Un admin va examiner ton dossier dans les 24-48h. Tu seras notifié dès que
                c'est traité.
              </p>
            </>
          )}
          {status === 'APPROVED' && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h1 className="font-display text-2xl">Candidature approuvée 🎉</h1>
              <p className="text-muted">
                Bienvenue dans l'équipe Valorank ! Tu peux désormais accéder à ton dashboard
                coach.
              </p>
              <Link href="/dashboard">
                <Button>Aller sur mon dashboard</Button>
              </Link>
            </>
          )}
          {status === 'REJECTED' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-danger" />
              <h1 className="font-display text-2xl">Candidature non retenue</h1>
              {application.reviewNote ? (
                <div className="mx-auto max-w-md rounded-lg border border-danger/30 bg-danger/5 p-3 text-left text-sm">
                  <strong>Retour de l'admin :</strong>
                  <p className="mt-1 text-muted">{application.reviewNote}</p>
                </div>
              ) : (
                <p className="text-muted">
                  Aucune note spécifique n'a été laissée par l'admin.
                </p>
              )}
              <p className="text-xs text-muted">
                Tu peux retravailler ton dossier et soumettre à nouveau.
              </p>
              <Button onClick={onResubmit}>Soumettre à nouveau</Button>
            </>
          )}

          <div className="border-t border-border pt-5 text-left">
            <h2 className="mb-3 text-sm font-medium">Dossier soumis</h2>
            <div className="space-y-2 text-sm">
              <Row label="Rang">
                <RankBadge rank={application.rank as ValorantRank} />
              </Row>
              <Row label="Soumis le">
                <span>{formatShort(application.createdAt)}</span>
              </Row>
              <Row label="Tarif proposé">
                <strong>{formatPrice(application.hourlyRate)}/h</strong>
              </Row>
              {application.reviewedAt && (
                <Row label="Traitée le">
                  <span>{formatShort(application.reviewedAt)}</span>
                </Row>
              )}
            </div>
          </div>

          {status === 'PENDING' && (
            <Button variant="ghost" onClick={onWithdraw}>
              Retirer ma candidature
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Cas non connecté ────────────────────────────────────────────────────

function SignedOutInvite() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Card>
        <CardContent className="space-y-6 p-10 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-accent-400" />
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">Deviens coach Valorank</h1>
            <p className="mt-3 text-muted">
              Connecte-toi ou crée un compte gratuit pour postuler. Tu pourras décrire ton
              niveau, joindre une preuve via tracker.gg ou une capture, et l'équipe Valorank
              examinera ton dossier sous 24-48h.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Perk
              icon={<Trophy className="h-5 w-5" />}
              title="Validation simple"
              desc="3 minutes pour soumettre ton dossier."
            />
            <Perk
              icon={<Crown className="h-5 w-5" />}
              title="Liberté"
              desc="Tu fixes ton tarif et tes créneaux."
            />
            <Perk
              icon={<Zap className="h-5 w-5" />}
              title="Audience qualifiée"
              desc="Joueurs vraiment motivés à progresser."
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up?next=/become-coach">
              <Button size="lg">Créer un compte</Button>
            </Link>
            <Link href="/sign-in?next=/become-coach">
              <Button size="lg" variant="outline">
                Se connecter
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CenterCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardContent className="space-y-4 p-8 text-center">
          {icon && <div className="mx-auto">{icon}</div>}
          <h1 className="font-display text-2xl">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
          <div className="pt-2">{action}</div>
        </CardContent>
      </Card>
      {/* Loader fallback height */}
      <div className="hidden">
        <Spinner />
      </div>
    </div>
  );
}
