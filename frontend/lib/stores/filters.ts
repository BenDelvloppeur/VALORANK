'use client';

import { create } from 'zustand';
import type { CoachFilters } from '@/lib/api/coaches';

interface FiltersStore {
  filters: CoachFilters;
  setFilter: <K extends keyof CoachFilters>(key: K, value: CoachFilters[K]) => void;
  reset: () => void;
}

const initial: CoachFilters = { sort: 'rating' };

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: initial,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  reset: () => set({ filters: initial }),
}));
