'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useUpdateCoach } from '@/lib/api/admin';
import {
  RANK_LABELS,
  SPECIALTIES,
  VALORANT_RANKS,
  type ValorantRank,
} from '@/lib/utils/valorant';
import { cn } from '@/lib/utils/cn';
import type { AdminCoach } from '@/types';

interface Props {
  coach: AdminCoach | null;
  onClose: () => void;
}

export function CoachEditDialog({ coach, onClose }: Props) {
  const update = useUpdateCoach();
  const [rank, setRank] = useState<ValorantRank>('IRON');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState(2000);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    if (coach) {
      setRank(coach.rank as ValorantRank);
      setDescription(coach.description);
      setHourlyRate(coach.hourlyRate);
      setSpecialties(coach.specialties);
      setFeatured(coach.featured);
    }
  }, [coach]);

  function toggleSpecialty(id: string) {
    setSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!coach) return;
    if (specialties.length === 0) {
      toast.error('Au moins une spécialité requise');
      return;
    }
    try {
      await update.mutateAsync({
        id: coach.id,
        data: { rank, description, hourlyRate, specialties, featured },
      });
      toast.success('Profil coach mis à jour');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <Dialog
      open={!!coach}
      onClose={onClose}
      title={coach ? `Éditer ${coach.user.username}` : ''}
      description="Modifie le profil coach (rang, tarif, description, spécialités, mise en avant)."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Rang Valorant"
            value={rank}
            onChange={(e) => setRank(e.target.value as ValorantRank)}
          >
            {VALORANT_RANKS.map((r) => (
              <option key={r} value={r}>
                {RANK_LABELS[r]}
              </option>
            ))}
          </Select>
          <Input
            label="Tarif horaire (€)"
            type="number"
            min={5}
            max={500}
            value={hourlyRate / 100}
            onChange={(e) => setHourlyRate(Number(e.target.value) * 100)}
            required
          />
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minLength={20}
          maxLength={500}
          rows={4}
          required
        />

        <div>
          <label className="text-xs font-medium text-muted">Spécialités</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => {
              const active = specialties.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSpecialty(s.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-all',
                    active
                      ? 'border-accent bg-accent/15 text-accent-400'
                      : 'border-border bg-surface-2 text-muted hover:border-border/80',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 p-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          <span className="text-sm">
            <span className="font-medium">Mettre en avant</span>{' '}
            <span className="text-muted">— affiche un contour doré « Recommandé par Valorank ».</span>
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={update.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
