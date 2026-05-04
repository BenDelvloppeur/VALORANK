import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatSlot(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, "EEEE d MMM 'à' HH'h'mm", { locale: fr });
}

export function formatShort(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'd MMM HH:mm', { locale: fr });
}

export function formatTimeOnly(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'HH:mm', { locale: fr });
}

export function relative(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function groupByDay<T extends { startsAt: string | Date }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = typeof item.startsAt === 'string' ? new Date(item.startsAt) : item.startsAt;
    const key = format(date, 'yyyy-MM-dd');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([key, slots]) => ({
    key,
    label: format(new Date(key), "EEEE d MMMM", { locale: fr }),
    slots,
  }));
}

export { isSameDay };
