import { Router } from 'express';
import { BookingStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/HttpError.js';
import { validate } from '../../utils/validate.js';

const router: Router = Router();

const CreateSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// POST /reviews — un client laisse un avis sur une réservation TERMINÉE.
// On recalcule la note moyenne du coach dans la même transaction.
router.post(
  '/',
  requireAuth(),
  validate(CreateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { bookingId, rating, comment } = req.body as z.infer<typeof CreateSchema>;

    const review = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { review: true },
      });
      if (!booking) throw HttpError.notFound('Réservation introuvable');
      if (booking.clientId !== userId) throw HttpError.forbidden();
      if (booking.status !== BookingStatus.COMPLETED) {
        throw HttpError.badRequest('Avis possible uniquement sur une session terminée');
      }
      if (booking.review) throw HttpError.conflict('Avis déjà laissé');

      const created = await tx.review.create({
        data: {
          bookingId,
          authorId: userId,
          coachId: booking.coachId,
          rating,
          comment,
        },
      });

      // Recalcule la moyenne dénormalisée
      const agg = await tx.review.aggregate({
        where: { coachId: booking.coachId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.coachProfile.update({
        where: { id: booking.coachId },
        data: {
          rating: agg._avg.rating ?? 0,
          reviewsCount: agg._count,
        },
      });

      return created;
    });

    res.status(201).json(review);
  }),
);

// GET /reviews/coach/:coachId — derniers avis d'un coach (public).
router.get(
  '/coach/:coachId',
  asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { coachId: req.params.coachId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { author: { select: { username: true, avatarUrl: true } } },
    });
    res.json(reviews);
  }),
);

export default router;
