'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useCoaches } from '@/lib/api/coaches';
import { CoachCard } from '@/components/coach/CoachCard';
import { Spinner } from '@/components/ui/Spinner';
import {
  Crosshair,
  Trophy,
  Headphones,
  ShieldCheck,
  Zap,
  Star,
  ArrowRight,
  Sparkles,
  Crown,
  CheckCircle2,
  ChevronDown,
  Quote,
} from 'lucide-react';
import { useState } from 'react';

const FEATURES = [
  {
    icon: Trophy,
    title: 'Coachs vérifiés',
    desc: 'Du Diamond au Radiant, tous nos coachs sont validés sur leurs résultats compétitifs.',
  },
  {
    icon: Zap,
    title: 'Réservation instantanée',
    desc: 'Choisis un créneau, paie en un clic, et reçois ta confirmation en temps réel.',
  },
  {
    icon: Headphones,
    title: 'Sessions sur mesure',
    desc: 'Aim, game sense, IGL, mental : trouve la spécialité qui débloquera ton plafond.',
  },
  {
    icon: ShieldCheck,
    title: 'Paiement sécurisé',
    desc: 'Le paiement est bloqué jusqu’à la fin de la session. Aucun risque pour toi.',
  },
];

export default function HomePage() {
  const { data: coaches, isLoading } = useCoaches({ sort: 'rating' });
  const top = coaches?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="bg-hero relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-50" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-24 text-center sm:px-6 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-200"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Plateforme #1 de coaching Valorant
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl text-balance font-display text-5xl leading-tight sm:text-6xl lg:text-7xl"
          >
            Fais sauter ton <span className="gradient-text">plafond compétitif</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl text-balance text-lg text-muted"
          >
            Réserve une session avec un coach Radiant ou Immortal. Aim, game sense, IGL —
            trouve l’expert qui correspond à tes objectifs et progresse sérieusement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/coaches">
              <Button size="lg">
                Trouver un coach
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/become-coach">
              <Button size="lg" variant="outline">
                <Sparkles className="h-4 w-4 text-accent-400" />
                Devenir coach
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 grid grid-cols-3 gap-8 border-t border-border/60 pt-6 text-left sm:gap-16"
          >
            {[
              { value: '500+', label: 'Sessions données' },
              { value: '4.9/5', label: 'Note moyenne' },
              { value: '24h', label: 'Délai moyen' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl text-primary">{stat.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">Une plateforme pensée pour gagner</h2>
          <p className="mt-3 text-muted">Tout ce qu’il te faut pour progresser. Rien de superflu.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/50"
            >
              <f.icon className="mb-4 h-6 w-6 text-primary" />
              <h3 className="mb-2 font-display text-lg">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TOP COACHS */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl">Top coachs cette semaine</h2>
              <p className="mt-2 text-muted">Les mieux notés par notre communauté.</p>
            </div>
            <Link href="/coaches" className="hidden items-center gap-1 text-sm text-primary hover:underline sm:inline-flex">
              Voir tous les coachs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : top.length === 0 ? (
            <p className="text-center text-muted">Aucun coach disponible pour le moment.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {top.map((c) => (
                <CoachCard key={c.id} coach={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <Quote className="mx-auto mb-3 h-7 w-7 text-primary" />
            <h2 className="font-display text-3xl">Ils ont fait sauter leur plafond</h2>
            <p className="mt-2 text-muted">
              Quelques retours de joueurs qui ont changé de palier grâce à Valorank.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-foreground/85">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary-200">
                    {t.author.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold">{t.author}</div>
                    <div className="text-muted">
                      {t.from} → <span className="text-success">{t.to}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COACH RECRUITMENT */}
      <section className="border-t border-border bg-gradient-to-b from-accent/5 via-transparent to-transparent">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-400">
              <Sparkles className="h-3.5 w-3.5" />
              Pour les joueurs expérimentés
            </div>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              Tu es <span className="gradient-text">Diamond+</span> ?<br />
              Deviens coach Valorank.
            </h2>
            <p className="mt-3 text-muted">
              Partage ton expertise, fixe ton tarif horaire, gère tes créneaux. On s'occupe du
              paiement, de la mise en relation et du chat. Tu te concentres sur le coaching.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                'Validation rapide via tracker.gg ou capture d\'écran',
                'Tu fixes ton tarif (la plupart entre 20 et 60 €/h)',
                'Liberté totale sur ton planning',
                'Mise en avant si tu fais de bons scores',
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {line}
                </li>
              ))}
            </ul>
            <Link href="/become-coach" className="mt-6 inline-block">
              <Button size="lg" variant="accent">
                <Crown className="h-4 w-4" />
                Postuler comme coach
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { value: '3 min', label: 'pour candidater' },
              { value: '24-48h', label: 'délai d\'examen' },
              { value: '~80%', label: 'reversé au coach' },
              { value: '100%', label: 'liberté de planning' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-surface p-5 text-center"
              >
                <div className="font-display text-3xl text-accent-400">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl">Questions fréquentes</h2>
            <p className="mt-2 text-muted">Les réponses qu'on nous donne le plus souvent.</p>
          </div>
          <Faq />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <Star className="h-10 w-10 text-gold" />
          <h2 className="font-display text-3xl sm:text-4xl">Prêt à gagner ton prochain rang ?</h2>
          <p className="max-w-xl text-muted">
            Crée ton compte gratuitement, choisis un coach et réserve ta première session en moins
            de 2 minutes.
          </p>
          <Link href="/sign-up">
            <Button size="lg">
              Démarrer maintenant
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const TESTIMONIALS = [
  {
    author: 'NoxBlade',
    from: 'Gold 2',
    to: 'Diamond 1',
    quote:
      'Trois sessions avec un Radiant et mon crosshair placement a complètement changé. Je gagne des duels que je perdais avant.',
  },
  {
    author: 'Aelia',
    from: 'Silver 3',
    to: 'Plat 2',
    quote:
      'Je ne savais plus comment progresser. Mon coach a démonté mes démos avec moi, j\'ai compris mes erreurs récurrentes.',
  },
  {
    author: 'Krios',
    from: 'Plat 3',
    to: 'Asc 1',
    quote:
      'Le coach IGL m\'a appris à driver mon équipe. Le passage en Ascendant s\'est fait naturellement après 5 sessions.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Comment se passe une session ?',
    a: 'Tu réserves un créneau, le coach te contacte via le chat de la plateforme. Vous convenez du format (review de démos, jeu en duo, training Aim Lab…) et c\'est parti.',
  },
  {
    q: 'Puis-je annuler ?',
    a: 'Oui, tant que la session n\'est pas confirmée par le coach. Une fois confirmée, l\'annulation se discute directement avec lui via le chat.',
  },
  {
    q: 'Combien coûte une session ?',
    a: 'Chaque coach fixe son tarif horaire. Compte entre 15 € pour un Plat et 50-70 € pour un Radiant. Tu peux filtrer par budget dans la liste.',
  },
  {
    q: 'Le paiement est-il sécurisé ?',
    a: 'Oui. Le paiement est bloqué le temps de la session, le coach n\'est crédité qu\'à la fin. Si quelque chose se passe mal, tu peux demander un remboursement.',
  },
  {
    q: 'Comment devenir coach ?',
    a: 'Crée un compte, va sur « Devenir coach » et remplis le formulaire (rang, lien tracker.gg ou capture, description). Un admin examine ton dossier en 24-48h.',
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {FAQ_ITEMS.map((item, i) => (
        <li key={item.q}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2"
          >
            <span className="font-medium">{item.q}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                open === i ? 'rotate-180 text-primary' : ''
              }`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-muted">{item.a}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
