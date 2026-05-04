import Link from 'next/link';
import { Crosshair } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <Crosshair className="h-5 w-5 text-primary" />
          VALOR<span className="text-primary">ANK</span>
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-sm text-muted">
          <Link href="/coaches" className="hover:text-foreground">
            Coachs
          </Link>
          <Link href="/about" className="hover:text-foreground">
            Comment ça marche
          </Link>
          <a href="mailto:hello@valorank.gg" className="hover:text-foreground">
            Contact
          </a>
        </nav>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Valorank. Non affilié à Riot Games.
        </p>
      </div>
    </footer>
  );
}
