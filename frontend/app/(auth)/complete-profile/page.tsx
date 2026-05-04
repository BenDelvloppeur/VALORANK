'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSyncProfile } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import { Crosshair, Gamepad2, Trophy } from 'lucide-react';

type Role = 'CLIENT' | 'COACH';

// Page de récupération : un user Supabase existe mais sans profil Prisma associé.
// On lui demande pseudo + rôle pour appeler /auth/sync.
export default function CompleteProfilePage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const sync = useSyncProfile();

  const [role, setRole] = useState<Role>('CLIENT');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!loading && !session) router.replace('/sign-in');
  }, [loading, session, router]);

  useEffect(() => {
    // Pré-remplit le pseudo avec la partie locale de l'email.
    if (session?.user.email && !username) {
      setUsername(session.user.email.split('@')[0]!.replace(/[^a-zA-Z0-9_-]/g, ''));
    }
  }, [session, username]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await sync.mutateAsync({ username, role });
      toast.success('Profil créé');
      router.push(role === 'COACH' ? '/dashboard' : '/coaches');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Crosshair className="h-8 w-8 text-primary" />
          <h1 className="font-display text-2xl">Finalise ton profil</h1>
          <p className="text-sm text-muted">
            Une dernière étape avant de jouer : choisis ton pseudo et ton rôle.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={cn(
              'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
              role === 'CLIENT'
                ? 'border-primary/60 bg-primary/10 shadow-glow'
                : 'border-border bg-surface-2',
            )}
          >
            <span className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="text-sm font-semibold">Joueur</span>
            </span>
            <span className="text-xs text-muted">Je veux progresser</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('COACH')}
            className={cn(
              'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
              role === 'COACH'
                ? 'border-primary/60 bg-primary/10 shadow-glow'
                : 'border-border bg-surface-2',
            )}
          >
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-semibold">Coach</span>
            </span>
            <span className="text-xs text-muted">Je veux enseigner</span>
          </button>
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
          />
          <Button type="submit" loading={sync.isPending} size="lg">
            Continuer
          </Button>
        </form>
      </Card>
    </div>
  );
}
