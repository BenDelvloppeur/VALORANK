'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { api, ApiError } from '@/lib/api/client';
import type { User } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  needsProfile: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Routes où on n'effectue PAS la redirection auto vers /complete-profile :
// auth, complete-profile lui-même, et toute page interne à ces flows.
const SKIP_REDIRECT_PREFIXES = ['/sign-in', '/sign-up', '/complete-profile'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      qc.invalidateQueries();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  // Récupère le profil applicatif. 404 = user Supabase OK mais pas de User Prisma.
  // On stocke null dans ce cas pour distinguer "pas connecté" de "à compléter".
  const { data: user, isLoading: profileLoading } = useQuery({
    queryKey: ['me', session?.user.id],
    enabled: !!session,
    retry: false,
    staleTime: 30_000,
    queryFn: async (): Promise<User | null> => {
      try {
        return await api<User>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });

  const needsProfile = !!session && user === null && !profileLoading;

  // Auto-redirect vers /complete-profile si user Supabase sans profil Prisma,
  // sauf si on est déjà sur les pages auth ou complete-profile.
  useEffect(() => {
    if (!needsProfile || !pathname) return;
    const skip = SKIP_REDIRECT_PREFIXES.some((p) => pathname.startsWith(p));
    if (!skip) router.replace('/complete-profile');
  }, [needsProfile, pathname, router]);

  // Et inversement : si profil OK et qu'on est sur /complete-profile, on dégage.
  useEffect(() => {
    if (user && pathname?.startsWith('/complete-profile')) {
      router.replace(user.role === 'COACH' ? '/dashboard' : '/coaches');
    }
  }, [user, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: user ?? null,
        loading,
        needsProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
