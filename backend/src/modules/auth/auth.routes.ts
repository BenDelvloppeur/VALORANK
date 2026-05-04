import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/HttpError.js';
import { validate } from '../../utils/validate.js';

const router: Router = Router();

const SyncSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  role: z.enum([Role.CLIENT, Role.COACH]),
  avatarUrl: z.string().url().optional(),
});

// POST /auth/sync — appelé après inscription Supabase pour créer le profil applicatif.
router.post(
  '/sync',
  requireAuth(),
  validate(SyncSchema),
  asyncHandler(async (req, res) => {
    const tokenUser = req.user!;
    const { username, role, avatarUrl } = req.body as z.infer<typeof SyncSchema>;

    const existingUser = await prisma.user.findUnique({
      where: { id: tokenUser.id },
    });
    if (existingUser) {
      res.json(existingUser);
      return;
    }

    const usernameTaken = await prisma.user.findUnique({ where: { username } });
    if (usernameTaken) throw HttpError.conflict('Pseudo déjà pris');

    const user = await prisma.user.create({
      data: {
        id: tokenUser.id,
        email: tokenUser.email,
        username,
        avatarUrl,
        role,
      },
    });

    if (role === Role.COACH) {
      await prisma.coachProfile.create({
        data: {
          userId: user.id,
          rank: 'IRON',
          description: 'Nouveau coach. Pense à compléter ton profil.',
          hourlyRate: 2000,
          specialties: ['AIM'],
        },
      });
    }

    res.status(201).json(user);
  }),
);

// GET /auth/me — renvoie le profil applicatif courant.
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!req.user?.username) throw HttpError.notFound('Profil non synchronisé');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { coachProfile: true },
    });
    if (!user) throw HttpError.notFound();
    res.json(user);
  }),
);

export default router;
