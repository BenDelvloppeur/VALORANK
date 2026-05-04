'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import {
  Crosshair,
  LogOut,
  User2,
  LayoutDashboard,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

const navLinks = [
  { href: '/coaches', label: 'Coachs' },
  { href: '/about', label: 'Comment ça marche' },
];

export function Navbar() {
  const pathname = usePathname();
  const { session, user, needsProfile, signOut } = useAuth();

  const isCoach = user?.role === 'COACH';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Crosshair className="h-6 w-6 text-primary" />
          <span>
            VALOR<span className="text-primary">ANK</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground',
                pathname?.startsWith(link.href) && 'text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {session && user ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href={isCoach ? '/dashboard' : '/client'}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  {isCoach ? 'Dashboard' : 'Mes sessions'}
                </Button>
              </Link>
              <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm sm:flex">
                <User2 className="h-4 w-4 text-muted" />
                <span className="font-medium">{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                aria-label="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : session && needsProfile ? (
            <>
              <Link href="/complete-profile">
                <Button variant="primary" size="sm">
                  <UserPlus className="h-4 w-4" />
                  Compléter mon profil
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                aria-label="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Se connecter
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="primary" size="sm">
                  Commencer
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
