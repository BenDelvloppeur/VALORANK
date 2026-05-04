import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Crosshair, Search, Calendar, CreditCard, Trophy, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: '1. Trouve ton coach',
    desc: 'Filtre par rang, prix et spécialité. Lis les avis pour faire le bon choix.',
  },
  {
    icon: Calendar,
    title: '2. Réserve un créneau',
    desc: 'Sélectionne un créneau qui colle à ton emploi du temps.',
  },
  {
    icon: CreditCard,
    title: '3. Paye en sécurité',
    desc: 'Le paiement est garanti — le coach n’est crédité qu’à la fin de la session.',
  },
  {
    icon: Trophy,
    title: '4. Progresse',
    desc: 'Joue ta session, puis laisse un avis pour aider la communauté.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <Crosshair className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h1 className="font-display text-4xl sm:text-5xl">Comment ça marche</h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted">
          Valorank est conçu pour que tu trouves le bon coach et progresses
          rapidement. Voici les 4 étapes pour passer du compte créé au prochain
          rank-up.
        </p>
      </div>

      <ol className="grid gap-5 sm:grid-cols-2">
        {STEPS.map((s) => (
          <li
            key={s.title}
            className="flex gap-4 rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <h2 className="font-display text-2xl">Tu es prêt à passer la vitesse supérieure ?</h2>
        <Link href="/coaches">
          <Button size="lg">
            Voir les coachs <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
