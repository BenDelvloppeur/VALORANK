'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useMe } from '@/lib/api/auth';
import { useUpdateMyCoachProfile } from '@/lib/api/coaches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  RANK_LABELS,
  SPECIALTIES,
  VALORANT_RANKS,
  type ValorantRank,
} from '@/lib/utils/valorant';
import { cn } from '@/lib/utils/cn';

export function CoachProfileForm() {
  const { data: me, isLoading } = useMe();
  const update = useUpdateMyCoachProfile();

  const [rank, setRank] = useState<ValorantRank>('IRON');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState(2000);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (me?.coachProfile) {
      setRank(me.coachProfile.rank as ValorantRank);
      setDescription(me.coachProfile.description);
      setHourlyRate(me.coachProfile.hourlyRate);
      setSpecialties(me.coachProfile.specialties);
      setAvatarUrl(me.avatarUrl ?? '');
    }
  }, [me]);

  function toggleSpecialty(id: string) {
    setSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (specialties.length === 0) {
      toast.error('Choisis au moins une spécialité');
      return;
    }
    try {
      await update.mutateAsync({
        rank,
        description,
        hourlyRate,
        specialties,
        avatarUrl: avatarUrl || undefined,
      });
      toast.success('Profil mis à jour');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  if (isLoading || !me) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mon profil coach</CardTitle>
      </CardHeader>
      <CardContent>
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

          <Input
            label="Avatar (URL)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={20}
            maxLength={1000}
            rows={5}
            placeholder="Parle de ton expérience, de ce que tu enseignes…"
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

          <div className="flex justify-end">
            <Button type="submit" loading={update.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
