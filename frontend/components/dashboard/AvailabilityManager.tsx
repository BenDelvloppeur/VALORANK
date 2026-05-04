'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  useBulkAvailabilities,
  useCreateAvailability,
  useDeleteAvailability,
  useMyAvailabilities,
} from '@/lib/api/availabilities';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { formatSlot, formatTimeOnly } from '@/lib/utils/dates';
import {
  CalendarPlus,
  Trash2,
  Calendar,
  Repeat,
  Clock,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { addDays, format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const DAYS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mer' },
  { id: 4, label: 'Jeu' },
  { id: 5, label: 'Ven' },
  { id: 6, label: 'Sam' },
  { id: 0, label: 'Dim' },
] as const;

export function AvailabilityManager() {
  return (
    <Tabs defaultValue="weekly">
      <TabsList>
        <TabsTrigger value="weekly" icon={<Calendar className="h-4 w-4" />}>
          Vue semaine
        </TabsTrigger>
        <TabsTrigger value="single" icon={<CalendarPlus className="h-4 w-4" />}>
          Ajout simple
        </TabsTrigger>
        <TabsTrigger value="bulk" icon={<Repeat className="h-4 w-4" />}>
          Génération hebdo
        </TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        <WeeklyView />
      </TabsContent>
      <TabsContent value="single">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <SlotList />
          <SingleAddCard />
        </div>
      </TabsContent>
      <TabsContent value="bulk">
        <BulkGeneratorCard />
      </TabsContent>
    </Tabs>
  );
}

// ─── Vue semaine (calendrier) ────────────────────────────────────────────────

function WeeklyView() {
  const { data: slots, isLoading } = useMyAvailabilities();
  const deleteSlot = useDeleteAvailability();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const slotsByDay = useMemo(() => {
    const map = new Map<string, typeof slots>();
    if (!slots) return map;
    for (const s of slots) {
      const key = format(new Date(s.startsAt), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      if (arr) arr.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  }, [slots]);

  async function handleDelete(id: string) {
    try {
      await deleteSlot.mutateAsync(id);
      toast.success('Créneau supprimé');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>
            Semaine du {format(weekStart, 'd MMM', { locale: fr })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              Aujourd'hui
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-7">
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const daySlots = slotsByDay.get(key) ?? [];
              const isToday =
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-lg border bg-surface-2 p-3',
                    isToday ? 'border-primary/60' : 'border-border',
                  )}
                >
                  <div className="mb-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-muted">
                      {format(day, 'EEEE', { locale: fr })}
                    </div>
                    <div
                      className={cn(
                        'text-lg font-bold',
                        isToday && 'text-primary',
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {daySlots.length === 0 ? (
                      <p className="text-center text-[10px] italic text-muted">—</p>
                    ) : (
                      daySlots.map((s) => (
                        <div
                          key={s.id}
                          className={cn(
                            'group flex items-center justify-between rounded border px-2 py-1 text-xs',
                            s.isBooked
                              ? 'border-primary/40 bg-primary/10 text-primary-200'
                              : 'border-border bg-surface text-foreground',
                          )}
                        >
                          <span className="font-mono">
                            {formatTimeOnly(s.startsAt)}–{formatTimeOnly(s.endsAt)}
                          </span>
                          {s.isBooked ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id)}
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-3 w-3 text-danger" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Liste simple ────────────────────────────────────────────────────────────

function SlotList() {
  const { data: slots, isLoading } = useMyAvailabilities();
  const deleteSlot = useDeleteAvailability();
  const [showPast, setShowPast] = useState(false);

  async function handleDelete(id: string) {
    try {
      await deleteSlot.mutateAsync(id);
      toast.success('Créneau supprimé');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  const filtered = useMemo(() => {
    if (!slots) return [];
    const now = new Date();
    return slots
      .filter((s) => (showPast ? true : new Date(s.startsAt) >= now))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [slots, showPast]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mes créneaux ({filtered.length})</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPast((v) => !v)}
          >
            {showPast ? 'Masquer le passé' : 'Voir le passé'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-7 w-7" />}
            title="Aucun créneau"
            description="Utilise « Ajout simple » ou « Génération hebdo » pour en créer."
          />
        ) : (
          <ul className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
            {filtered.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatSlot(slot.startsAt)}</span>
                  {slot.isBooked && <Badge variant="primary">Réservé</Badge>}
                </div>
                {!slot.isBooked && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(slot.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Ajout simple ────────────────────────────────────────────────────────────

function SingleAddCard() {
  const createSlot = useCreateAvailability();
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!date || !start || !end) return;
    const startsAt = new Date(`${date}T${start}:00`).toISOString();
    const endsAt = new Date(`${date}T${end}:00`).toISOString();
    try {
      await createSlot.mutateAsync({ startsAt, endsAt });
      toast.success('Créneau ajouté');
      setStart('');
      setEnd('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un créneau</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Début"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
            <Input
              label="Fin"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={createSlot.isPending}>
            <CalendarPlus className="h-4 w-4" />
            Ajouter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Génération hebdo ────────────────────────────────────────────────────────

function BulkGeneratorCard() {
  const bulk = useBulkAvailabilities();
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [duration, setDuration] = useState(60);
  const [weeks, setWeeks] = useState(4);

  const previewSlots = useMemo(() => {
    return generateSlots({ days, startTime, endTime, durationMin: duration, weeks });
  }, [days, startTime, endTime, duration, weeks]);

  async function handleGenerate() {
    if (previewSlots.length === 0) {
      toast.error('Aucun créneau à générer');
      return;
    }
    try {
      const r = await bulk.mutateAsync(
        previewSlots.map((s) => ({
          startsAt: s.start.toISOString(),
          endsAt: s.end.toISOString(),
        })),
      );
      toast.success(
        `${r.created} créneaux créés${r.skipped > 0 ? ` • ${r.skipped} ignorés (chevauchement)` : ''}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  }

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-accent-400" />
            Générer un planning hebdomadaire
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label className="text-xs font-medium text-muted">Jours de la semaine</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const active = days.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm transition-all',
                    active
                      ? 'border-accent bg-accent/15 text-accent-400'
                      : 'border-border bg-surface-2 text-muted',
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            label="Début"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="Fin"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          <Input
            label="Durée (min)"
            type="number"
            min={30}
            max={240}
            step={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <Input
            label="Sur N semaines"
            type="number"
            min={1}
            max={12}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
          />
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              Aperçu :{' '}
              <strong className="text-foreground">{previewSlots.length}</strong>{' '}
              créneau{previewSlots.length > 1 ? 'x' : ''} sera{previewSlots.length > 1 ? 'ont' : ''}{' '}
              proposé{previewSlots.length > 1 ? 's' : ''} (les chevauchements seront ignorés
              côté serveur).
            </span>
          </div>
          {previewSlots.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto text-xs text-muted">
              {previewSlots.slice(0, 8).map((s, i) => (
                <div key={i}>
                  {format(s.start, "EEE d MMM 'à' HH:mm", { locale: fr })} –{' '}
                  {format(s.end, 'HH:mm', { locale: fr })}
                </div>
              ))}
              {previewSlots.length > 8 && (
                <div className="mt-1 italic">… et {previewSlots.length - 8} autres</div>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleGenerate} loading={bulk.isPending} className="w-full">
          <CalendarPlus className="h-4 w-4" />
          Générer {previewSlots.length} créneaux
        </Button>
      </CardContent>
    </Card>
  );
}

function generateSlots({
  days,
  startTime,
  endTime,
  durationMin,
  weeks,
}: {
  days: number[];
  startTime: string;
  endTime: string;
  durationMin: number;
  weeks: number;
}) {
  const out: { start: Date; end: Date }[] = [];
  if (days.length === 0 || durationMin <= 0) return out;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (
    sh === undefined ||
    sm === undefined ||
    eh === undefined ||
    em === undefined ||
    isNaN(sh) ||
    isNaN(sm) ||
    isNaN(eh) ||
    isNaN(em)
  ) {
    return out;
  }
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) return out;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(today, w * 7 + d);
      if (!days.includes(date.getDay())) continue;
      let cur = startMinutes;
      while (cur + durationMin <= endMinutes) {
        const start = new Date(date);
        start.setHours(Math.floor(cur / 60), cur % 60, 0, 0);
        if (start < new Date()) {
          cur += durationMin;
          continue;
        }
        const end = new Date(start.getTime() + durationMin * 60 * 1000);
        out.push({ start, end });
        cur += durationMin;
      }
    }
  }
  return out;
}
