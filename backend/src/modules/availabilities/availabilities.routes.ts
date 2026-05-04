import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/HttpError.js';
import { validate } from '../../utils/validate.js';

const router: Router = Router();

const CreateSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((d) => d.endsAt > d.startsAt, {
    message: 'endsAt doit être strictement après startsAt',
  });

// POST /availabilities — un coach ajoute un créneau de disponibilité.
router.post(
  '/',
  requireAuth(),
  requireRole('COACH'),
  validate(CreateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const profile = await prisma.coachProfile.findUnique({ where: { userId } });
    if (!profile) throw HttpError.notFound('Profil coach manquant');

    const { startsAt, endsAt } = req.body as z.infer<typeof CreateSchema>;

    // Vérifie qu'il n'y a pas de chevauchement
    const overlap = await prisma.availability.findFirst({
      where: {
        coachId: profile.id,
        OR: [
          {
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        ],
      },
    });
    if (overlap) throw HttpError.conflict('Ce créneau chevauche un créneau existant');

    const availability = await prisma.availability.create({
      data: { coachId: profile.id, startsAt, endsAt },
    });

    res.status(201).json(availability);
  }),
);

// POST /availabilities/bulk — création en masse (planning hebdomadaire répété).
const BulkSchema = z.object({
  slots: z
    .array(
      z
        .object({
          startsAt: z.coerce.date(),
          endsAt: z.coerce.date(),
        })
        .refine((d) => d.endsAt > d.startsAt, {
          message: 'endsAt > startsAt',
        }),
    )
    .min(1)
    .max(200),
});
router.post(
  '/bulk',
  requireAuth(),
  requireRole('COACH'),
  validate(BulkSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const profile = await prisma.coachProfile.findUnique({ where: { userId } });
    if (!profile) throw HttpError.notFound('Profil coach manquant');
    const { slots } = req.body as z.infer<typeof BulkSchema>;

    // Récupère les créneaux futurs existants pour filtrer ceux qui chevaucheraient.
    const horizon = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.availability.findMany({
      where: { coachId: profile.id, startsAt: { gte: horizon } },
      select: { startsAt: true, endsAt: true },
    });

    function overlapsExisting(start: Date, end: Date) {
      return existing.some((e) => start < e.endsAt && end > e.startsAt);
    }

    const seen = new Set<string>();
    const toCreate = slots.filter((s) => {
      const key = `${s.startsAt.toISOString()}|${s.endsAt.toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (s.startsAt < new Date()) return false;
      return !overlapsExisting(s.startsAt, s.endsAt);
    });

    if (toCreate.length === 0) {
      res.json({ created: 0, skipped: slots.length });
      return;
    }
    const result = await prisma.availability.createMany({
      data: toCreate.map((s) => ({
        coachId: profile.id,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
      })),
    });
    res.json({ created: result.count, skipped: slots.length - result.count });
  }),
);

// GET /availabilities/me — créneaux du coach connecté.
router.get(
  '/me',
  requireAuth(),
  requireRole('COACH'),
  asyncHandler(async (req, res) => {
    const profile = await prisma.coachProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) throw HttpError.notFound();
    const availabilities = await prisma.availability.findMany({
      where: { coachId: profile.id },
      orderBy: { startsAt: 'asc' },
    });
    res.json(availabilities);
  }),
);

// DELETE /availabilities/:id — supprime un créneau (uniquement le propriétaire).
router.delete(
  '/:id',
  requireAuth(),
  requireRole('COACH'),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const availability = await prisma.availability.findUnique({
      where: { id },
      include: { coach: true },
    });
    if (!availability) throw HttpError.notFound();
    if (availability.coach.userId !== req.user!.id) throw HttpError.forbidden();
    if (availability.isBooked) throw HttpError.conflict('Créneau déjà réservé');

    await prisma.availability.delete({ where: { id } });
    res.status(204).end();
  }),
);

export default router;
