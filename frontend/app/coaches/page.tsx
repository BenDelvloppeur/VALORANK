'use client';

import { useFiltersStore } from '@/lib/stores/filters';
import { useCoaches } from '@/lib/api/coaches';
import { CoachCard } from '@/components/coach/CoachCard';
import { CoachFilters } from '@/components/coach/CoachFilters';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CoachesListingPage() {
  const filters = useFiltersStore((s) => s.filters);
  const { data, isLoading, error } = useCoaches(filters);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl">Trouve ton coach</h1>
        <p className="text-muted">
          Filtre par rang, prix ou spécialité. Tous les profils sont vérifiés.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <CoachFilters />

        <section>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <EmptyState
              title="Impossible de charger les coachs"
              description="Vérifie ta connexion ou réessaye plus tard."
            />
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Aucun coach ne correspond"
              description="Essaie d’élargir tes critères de recherche."
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {data.length} coach{data.length > 1 ? 's' : ''} trouvé
                {data.length > 1 ? 's' : ''}
              </p>
              <motion.div
                layout
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {data.map((c) => (
                  <CoachCard key={c.id} coach={c} />
                ))}
              </motion.div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
