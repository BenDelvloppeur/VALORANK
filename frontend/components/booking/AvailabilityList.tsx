'use client';

import type { Availability } from '@/types';
import { groupByDay, formatTimeOnly } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarOff } from 'lucide-react';

interface AvailabilityListProps {
  availabilities: Availability[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showAvailableOnly?: boolean;
}

// Affiche les créneaux groupés par jour. Sélectionnable si onSelect est fourni.
export function AvailabilityList({
  availabilities,
  selectedId,
  onSelect,
  showAvailableOnly = true,
}: AvailabilityListProps) {
  const filtered = showAvailableOnly
    ? availabilities.filter((a) => !a.isBooked)
    : availabilities;

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<CalendarOff className="h-7 w-7" />}
        title="Aucun créneau disponible"
        description="Reviens plus tard ou contacte directement le coach."
      />
    );
  }

  const groups = groupByDay(filtered);

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.key} className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted">{g.label}</h4>
          <div className="flex flex-wrap gap-2">
            {g.slots.map((slot) => {
              const selected = selectedId === slot.id;
              const interactive = !!onSelect && !slot.isBooked;
              return (
                <button
                  key={slot.id}
                  disabled={!interactive}
                  onClick={interactive ? () => onSelect!(slot.id) : undefined}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-all',
                    slot.isBooked && 'cursor-not-allowed opacity-50 line-through',
                    selected
                      ? 'border-primary bg-primary/15 text-primary-200 shadow-glow'
                      : 'border-border bg-surface-2 hover:border-primary/40 hover:text-primary-200',
                  )}
                >
                  {formatTimeOnly(slot.startsAt)} – {formatTimeOnly(slot.endsAt)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
