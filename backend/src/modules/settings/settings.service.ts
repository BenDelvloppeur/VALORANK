import { prisma } from '../../lib/prisma.js';

// Clés des paramètres globaux supportés.
export const SETTING_KEYS = {
  COMMISSION_RATE: 'commissionRate',
} as const;

// Cache mémoire 30s pour éviter de relire la DB à chaque booking créée.
const cache = new Map<string, { value: unknown; expiresAt: number }>();
const TTL_MS = 30_000;

export const DEFAULTS = {
  commissionRate: 0.2,
} as const;

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }
  const row = await prisma.setting.findUnique({ where: { key } });
  const value = (row?.value as T) ?? fallback;
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

export async function setSetting<T>(key: string, value: T): Promise<T> {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

export async function getCommissionRate(): Promise<number> {
  const value = await getSetting<number>(SETTING_KEYS.COMMISSION_RATE, DEFAULTS.commissionRate);
  // Sécurise contre une valeur corrompue
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
    return DEFAULTS.commissionRate;
  }
  return value;
}

export function computeCommission(amountCents: number, rate: number) {
  const commissionCents = Math.round(amountCents * rate);
  const payoutCents = amountCents - commissionCents;
  return { commissionCents, payoutCents };
}
