// Métadonnées Valorant (rangs, spécialités) partagées par toute l'UI.

export const VALORANT_RANKS = [
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'ASCENDANT',
  'IMMORTAL',
  'RADIANT',
] as const;

export type ValorantRank = (typeof VALORANT_RANKS)[number];

export const RANK_LABELS: Record<ValorantRank, string> = {
  IRON: 'Iron',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
  ASCENDANT: 'Ascendant',
  IMMORTAL: 'Immortal',
  RADIANT: 'Radiant',
};

// Couleurs cohérentes avec l'esthétique Valorant (approximation).
export const RANK_COLORS: Record<ValorantRank, string> = {
  IRON: 'bg-zinc-700 text-zinc-200',
  BRONZE: 'bg-amber-900/60 text-amber-200',
  SILVER: 'bg-slate-400/30 text-slate-100',
  GOLD: 'bg-yellow-600/30 text-yellow-200',
  PLATINUM: 'bg-cyan-700/40 text-cyan-100',
  DIAMOND: 'bg-fuchsia-700/40 text-fuchsia-100',
  ASCENDANT: 'bg-emerald-700/40 text-emerald-100',
  IMMORTAL: 'bg-red-700/50 text-red-100',
  RADIANT: 'bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 text-zinc-900',
};

export const SPECIALTIES = [
  { id: 'AIM', label: 'Aim' },
  { id: 'GAME_SENSE', label: 'Game sense' },
  { id: 'STRATEGY', label: 'Stratégie' },
  { id: 'AGENT_MASTERY', label: 'Maîtrise agent' },
  { id: 'MENTAL', label: 'Mental & tilt' },
  { id: 'IGL', label: 'IGL / shotcalling' },
  { id: 'UTILITY', label: 'Utility & lineups' },
] as const;

export type Specialty = (typeof SPECIALTIES)[number]['id'];

export function specialtyLabel(id: string): string {
  return SPECIALTIES.find((s) => s.id === id)?.label ?? id;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
