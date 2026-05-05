import { Router } from 'express';
import { ApplicationStatus, Role, ValorantRank } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/HttpError.js';
import { validate } from '../../utils/validate.js';

const router: Router = Router();

const SubmitSchema = z.object({
  rank: z.nativeEnum(ValorantRank),
  trackerUrl: z
    .string()
    .url('Lien invalide')
    .refine(
      (u) => /tracker\.gg/i.test(u),
      'Le lien doit pointer vers tracker.gg/valorant',
    )
    .optional()
    .or(z.literal('').transform(() => undefined)),
  screenshotUrl: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  description: z
    .string()
    .min(50, 'Au moins 50 caractères pour décrire ton expérience')
    .max(2000),
  experience: z.string().max(1000).optional().or(z.literal('').transform(() => undefined)),
  hourlyRate: z.number().int().min(500).max(50_000),
  specialties: z.array(z.string()).min(1).max(8),
});

// GET /applications/me — état de ma candidature.
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const application = await prisma.coachApplication.findUnique({
      where: { userId },
      include: {
        reviewedBy: { select: { username: true } },
      },
    });
    res.json(application);
  }),
);

// POST /applications — création / mise à jour de ma candidature.
// Refuse si l'utilisateur est déjà COACH ou s'il y a déjà une candidature APPROVED.
router.post(
  '/',
  requireAuth(),
  validate(SubmitSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    if (req.user!.role === Role.COACH) {
      throw HttpError.badRequest('Tu es déjà coach.');
    }
    const data = req.body as z.infer<typeof SubmitSchema>;

    const existing = await prisma.coachApplication.findUnique({ where: { userId } });
    if (existing && existing.status === ApplicationStatus.APPROVED) {
      throw HttpError.badRequest('Ta candidature a déjà été approuvée.');
    }

    // Si on resoumet après un refus, on remet le statut en PENDING et on
    // efface les infos de review pour repartir proprement.
    const application = await prisma.coachApplication.upsert({
      where: { userId },
      update: {
        ...data,
        status: ApplicationStatus.PENDING,
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
      },
      create: {
        userId,
        ...data,
      },
    });

    res.status(201).json(application);
  }),
);

// DELETE /applications/me — retirer sa candidature (uniquement si PENDING).
router.delete(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const existing = await prisma.coachApplication.findUnique({ where: { userId } });
    if (!existing) throw HttpError.notFound();
    if (existing.status !== ApplicationStatus.PENDING) {
      throw HttpError.badRequest(
        'Seule une candidature en attente d\'examen peut être retirée.',
      );
    }
    await prisma.coachApplication.delete({ where: { userId } });
    res.status(204).end();
  }),
);

export default router;
