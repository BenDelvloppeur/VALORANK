'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Crosshair } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/coaches';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Connexion réussie');
    router.push(next);
    router.refresh();
  }

  return (
    <Card className="w-full p-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Crosshair className="h-8 w-8 text-primary" />
        <h1 className="font-display text-2xl">Bon retour</h1>
        <p className="text-sm text-muted">Reconnecte-toi pour réserver ta prochaine session.</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
        />
        <Button type="submit" loading={loading} size="lg" className="mt-2">
          Se connecter
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link href="/sign-up" className="text-primary hover:underline">
          Crée-en un
        </Link>
      </p>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <Suspense fallback={<Card className="w-full p-8" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
