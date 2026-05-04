'use client';

import { useFiltersStore } from '@/lib/stores/filters';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { RANK_LABELS, SPECIALTIES, VALORANT_RANKS } from '@/lib/utils/valorant';
import { Search, RotateCcw } from 'lucide-react';

export function CoachFilters() {
  const { filters, setFilter, reset } = useFiltersStore();

  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base">Filtres</h2>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Pseudo…"
          value={filters.search ?? ''}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </div>

      <Select
        label="Rang"
        value={filters.rank ?? ''}
        onChange={(e) => setFilter('rank', e.target.value || undefined)}
      >
        <option value="">Tous les rangs</option>
        {VALORANT_RANKS.map((r) => (
          <option key={r} value={r}>
            {RANK_LABELS[r]}
          </option>
        ))}
      </Select>

      <Select
        label="Spécialité"
        value={filters.specialty ?? ''}
        onChange={(e) => setFilter('specialty', e.target.value || undefined)}
      >
        <option value="">Toutes</option>
        {SPECIALTIES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prix min (€)"
          type="number"
          min={0}
          value={filters.minPrice !== undefined ? filters.minPrice / 100 : ''}
          onChange={(e) =>
            setFilter(
              'minPrice',
              e.target.value ? Number(e.target.value) * 100 : undefined,
            )
          }
        />
        <Input
          label="Prix max (€)"
          type="number"
          min={0}
          value={filters.maxPrice !== undefined ? filters.maxPrice / 100 : ''}
          onChange={(e) =>
            setFilter(
              'maxPrice',
              e.target.value ? Number(e.target.value) * 100 : undefined,
            )
          }
        />
      </div>

      <Input
        label="Disponible le"
        type="date"
        value={filters.date ?? ''}
        onChange={(e) => setFilter('date', e.target.value || undefined)}
      />

      <Select
        label="Trier par"
        value={filters.sort ?? 'rating'}
        onChange={(e) => setFilter('sort', e.target.value as never)}
      >
        <option value="rating">Meilleures notes</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
        <option value="recent">Plus récents</option>
      </Select>
    </aside>
  );
}
