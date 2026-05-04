import { Router } from 'express';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/HttpError.js';
import { validate } from '../../utils/validate.js';
import { computeCommission, getCommissionRate } from '../settings/settings.service.js';

const router: Router = Router();

const CreateSchema = z.object({
  availabilityId: z.string().min(1),
});

// POST /bookings — un client réserve un créneau.
// On utilise une transaction Prisma pour éviter les double-bookings concurrents.
router.post(
  '/',
  requireAuth(),
  validate(CreateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    if (!req.user!.username) throw HttpError.unauthorized('Profil non synchronisé');

    const { availabilityId } = req.body as z.infer<typeof CreateSchema>;

    const booking = await prisma.$transaction(async (tx) => {
      const availability = await tx.availability.findUnique({
        where: { id: availabilityId },
        include: { coach: true },
      });
      if (!availability) throw HttpError.notFound('Créneau introuvable');
      if (availability.isBooked) throw HttpError.conflict('Créneau déjà pris');
      if (availability.coach.userId === userId) {
        throw HttpError.badRequest('Vous ne pouvez pas vous réserver vous-même');
      }

      const durationMs = availability.endsAt.getTime() - availability.startsAt.getTime();
      const hours = durationMs / (1000 * 60 * 60);
      const amount = Math.round(availability.coach.hourlyRate * hours);

      const commissionRate = await getCommissionRate();
      const { commissionCents, payoutCents } = computeCommission(amount, commissionRate);

      await tx.availability.update({
        where: { id: availability.id },
        data: { isBooked: true },
      });

      return tx.booking.create({
        data: {
          clientId: userId,
          coachId: availability.coachId,
          availabilityId: availability.id,
          startsAt: availability.startsAt,
          endsAt: availability.endsAt,
          amount,
          commissionRate,
          commissionCents,
          payoutCents,
        },
        include: {
          coach: { include: { user: { select: { username: true, avatarUrl: true } } } },
        },
      });
    });

    res.status(201).json(booking);
  }),
);

// GET /bookings/me — toutes les réservations de l'utilisateur (en tant que client OU coach).
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const asClient = await prisma.booking.findMany({
      where: { clientId: userId },
      orderBy: { startsAt: 'desc' },
      include: {
        coach: { include: { user: { select: { username: true, avatarUrl: true } } } },
        review: true,
      },
    });

    const profile = await prisma.coachProfile.findUnique({ where: { userId } });
    const asCoach = profile
      ? await prisma.booking.findMany({
          where: { coachId: profile.id },
          orderBy: { startsAt: 'desc' },
          include: {
            client: { select: { id: true, username: true, avatarUrl: true } },
            review: true,
          },
        })
      : [];

    res.json({ asClient, asCoach });
  }),
);

// GET /bookings/:id — détail d'une réservation (client, coach ou admin).
router.get(
  '/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        coach: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        client: { select: { id: true, username: true, avatarUrl: true } },
        review: true,
      },
    });
    if (!booking) throw HttpError.notFound();

    const userId = req.user!.id;
    const isClient = booking.clientId === userId;
    const isCoach = booking.coach.user.id === userId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isClient && !isCoach && !isAdmin) throw HttpError.forbidden();

    res.json(booking);
  }),
);

const StatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

// PATCH /bookings/:id/status — coach confirme / marque terminé, client annule.
router.patch(
  '/:id/status',
  requireAuth(),
  validate(StatusSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body as z.infer<typeof StatusSchema>;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { coach: true },
    });
    if (!booking) throw HttpError.notFound();

    const userId = req.user!.id;
    const isClient = booking.clientId === userId;
    const isCoach = booking.coach.userId === userId;

    // Règles simples : client peut CANCELLED, coach peut CONFIRMED/COMPLETED/CANCELLED.
    if (status === BookingStatus.CANCELLED && !(isClient || isCoach)) {
      throw HttpError.forbidden();
    }
    if ((status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED) && !isCoach) {
      throw HttpError.forbidden('Seul le coach peut confirmer ou clôturer');
    }
    if (status === BookingStatus.PENDING) {
      throw HttpError.badRequest('Statut PENDING non modifiable');
    }

    const updates: Prisma.BookingUpdateInput = { status };
    if (status === BookingStatus.CANCELLED) {
      // libère le créneau
      await prisma.availability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false },
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: updates,
    });

    res.json(updated);
  }),
);

// POST /bookings/:id/pay — paiement *mock* (Stripe simulation).
router.post(
  '/:id/pay',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw HttpError.notFound();
    if (booking.clientId !== req.user!.id) throw HttpError.forbidden();
    if (booking.payment === PaymentStatus.PAID) {
      throw HttpError.conflict('Déjà payé');
    }

    // Simule une latence + 95% de succès, déterministe ici.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        payment: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
      },
    });
    res.json(updated);
  }),
);

export default router;
