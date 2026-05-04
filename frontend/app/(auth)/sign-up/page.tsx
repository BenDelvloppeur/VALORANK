'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useSyncProfile } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import { Crosshair, Gamepad2, Trophy } from 'lucide-react';

type Role = 'CLIENT' | 'COACH';

export default function SignUpPage() {
  const router = useRouter();
  const sync = useSyncProfile();

  const [role, setRole] = useState<Role>('CLIENT');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, role } },
      });
      if (error) throw error;
      if (!data.session) {
        toast.success('Vérifie ton email pour confirmer ton compte.');
        return;
      }
      // Synchronise le profil applicatif côté backend (crée le User Prisma).
      await sync.mutateAsync({ username, role });
      toast.success('Compte créé. Bienvenue !');
      router.push(role === 'COACH' ? '/dashboard' : '/coaches');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l’inscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Crosshair className="h-8 w-8 text-primary" />
          <h1 className="font-display text-2xl">Rejoins Valorank</h1>
          <p className="text-sm text-muted">Choisis ton camp et progresse.</p>
        </div>

        {/* Sélection du rôle */}
        <div className="mb-6 grid grid-cols-2 gap-2">
          <RoleCard
            icon={<Gamepad2 className="h-5 w-5" />}
            label="Joueur"
            sub="Je veux progresser"
            active={role === 'CLIENT'}
            onClick={() => setRole('CLIENT')}
          />
          <RoleCard
            icon={<Trophy className="h-5 w-5" />}
            label="Coach"
            sub="Je veux enseigner"
            active={role === 'COACH'}
            onClick={() => setRole('COACH')}
          />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_-]+"
            placeholder="Ex : ph4ntom_"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading} size="lg" className="mt-2">
            Créer mon compte
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Déjà inscrit ?{' '}
          <Link href="/sign-in" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </Card>
    </div>
  );
}

function RoleCard({
  icon,
  label,
  sub,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
        active
          ? 'border-primary/60 bg-primary/10 shadow-glow'
          : 'border-border bg-surface-2 hover:border-border/80',
      )}
    >
      <span className={cn('flex items-center gap-2', active ? 'text-primary' : 'text-muted')}>
        {icon}
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </span>
      <span className="text-xs text-muted">{sub}</span>
    </button>
  );
}
