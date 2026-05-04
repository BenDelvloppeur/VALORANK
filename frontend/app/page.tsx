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
} from 'lucide-react';

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
            <Link href="/sign-up">
              <Button size="lg" variant="outline">
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
