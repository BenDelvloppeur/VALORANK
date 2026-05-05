import { Router } from 'express';
import {
  ApplicationStatus,
  BookingStatus,
  PaymentStatus,
  Role,
  ValorantRank,
} from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../utils/validate.js';
import { HttpError } from '../../utils/HttpError.js';
import {
  computeCommission,
  getCommissionRate,
  getSetting,
  setSetting,
  SETTING_KEYS,
} from '../settings/settings.service.js';

const router: Router = Router();

router.use(requireAuth(), requireRole(Role.ADMIN));

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/users
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { coachProfile: true },
    });
    res.json(users);
  }),
);

const RoleSchema = z.object({ role: z.nativeEnum(Role) });

router.patch(
  '/users/:id/role',
  validate(RoleSchema),
  asyncHandler(async (req, res) => {
    const { role } = req.body as z.infer<typeof RoleSchema>;
    const id = req.params.id!;
    const user = await prisma.user.update({ where: { id }, data: { role } });
    if (role === Role.COACH) {
      await prisma.coachProfile.upsert({
        where: { userId: id },
        update: {},
        create: {
          userId: id,
          rank: 'IRON',
          description: 'Profil à compléter — promu coach par un administrateur.',
          hourlyRate: 2000,
          specialties: ['AIM'],
        },
      });
    }
    res.json(user);
  }),
);

// POST /admin/users/:id/reset-password — réinitialise via Supabase Auth.
const ResetPasswordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères'),
});
router.post(
  '/users/:id/reset-password',
  validate(ResetPasswordSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const { password } = req.body as z.infer<typeof ResetPasswordSchema>;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password,
      email_confirm: true,
    });
    if (error) throw HttpError.badRequest(error.message);
    res.json({ ok: true });
  }),
);

// DELETE /admin/users/:id — purge complète user + bookings/reviews/messages + Supabase Auth.
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    if (id === req.user!.id) {
      throw HttpError.badRequest('Tu ne peux pas supprimer ton propre compte admin');
    }
    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) throw HttpError.notFound('Utilisateur introuvable');

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { senderId: id } }),
      prisma.review.deleteMany({ where: { authorId: id } }),
      prisma.booking.deleteMany({ where: { clientId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error && !error.message.toLowerCase().includes('not found')) {
      console.warn('[admin] supabase deleteUser warning:', error.message);
    }
    res.status(204).end();
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// COACHES
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/coaches — liste enrichie pour le tableau d'admin.
router.get(
  '/coaches',
  asyncHandler(async (_req, res) => {
    const coaches = await prisma.coachProfile.findMany({
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, email: true, createdAt: true } },
        _count: { select: { bookings: true, reviews: true, availabilities: true } },
      },
    });
    res.json(coaches);
  }),
);

const FeaturedSchema = z.object({ featured: z.boolean() });
router.patch(
  '/coaches/:id/featured',
  validate(FeaturedSchema),
  asyncHandler(async (req, res) => {
    const { featured } = req.body as z.infer<typeof FeaturedSchema>;
    const profile = await prisma.coachProfile.update({
      where: { id: req.params.id },
      data: { featured },
    });
    res.json(profile);
  }),
);

// PATCH /admin/coaches/:id — édition complète d'un profil coach par l'admin.
const UpdateCoachSchema = z.object({
  rank: z.nativeEnum(ValorantRank).optional(),
  description: z.string().min(20).max(500).optional(),
  hourlyRate: z.number().int().min(500).max(50_000).optional(),
  specialties: z.array(z.string()).min(1).optional(),
  featured: z.boolean().optional(),
});
router.patch(
  '/coaches/:id',
  validate(UpdateCoachSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof UpdateCoachSchema>;
    const profile = await prisma.coachProfile.update({
      where: { id: req.params.id },
      data,
    });
    res.json(profile);
  }),
);

router.delete(
  '/coaches/:id',
  asyncHandler(async (req, res) => {
    const exists = await prisma.coachProfile.findUnique({ where: { id: req.params.id } });
    if (!exists) throw HttpError.notFound();
    await prisma.coachProfile.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS / CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/conversations — liste des bookings + dernier message (modération).
router.get(
  '/conversations',
  asyncHandler(async (_req, res) => {
    const bookings = await prisma.booking.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, username: true, avatarUrl: true } },
        coach: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { username: true } } },
        },
        review: true,
        _count: { select: { messages: true } },
      },
      take: 500,
    });
    res.json(bookings);
  }),
);

// PATCH /admin/bookings/:id/status — override admin pour forcer un statut.
const AdminStatusSchema = z.object({ status: z.nativeEnum(BookingStatus) });
router.patch(
  '/bookings/:id/status',
  validate(AdminStatusSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const { status } = req.body as z.infer<typeof AdminStatusSchema>;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw HttpError.notFound();

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id }, data: { status } });
      // CANCELLED => libère le créneau ; PENDING/CONFIRMED/COMPLETED => le créneau reste pris.
      await tx.availability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: status !== BookingStatus.CANCELLED },
      });
    });
    res.json({ ok: true });
  }),
);

// PATCH /admin/bookings/:id/refund — marque la booking REFUNDED + statut CANCELLED.
router.patch(
  '/bookings/:id/refund',
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw HttpError.notFound();
    if (booking.payment !== PaymentStatus.PAID) {
      throw HttpError.badRequest('Seules les réservations payées peuvent être remboursées');
    }
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { payment: PaymentStatus.REFUNDED, status: BookingStatus.CANCELLED },
      });
      await tx.availability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false },
      });
    });
    res.json({ ok: true });
  }),
);

// DELETE /admin/bookings/:id — supprime entièrement (cascade messages + review).
router.delete(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { review: true },
    });
    if (!booking) throw HttpError.notFound('Réservation introuvable');

    const hadReview = !!booking.review;
    const coachId = booking.coachId;

    await prisma.$transaction(async (tx) => {
      await tx.availability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false },
      });
      await tx.booking.delete({ where: { id } });
      if (hadReview) {
        const agg = await tx.review.aggregate({
          where: { coachId },
          _avg: { rating: true },
          _count: true,
        });
        await tx.coachProfile.update({
          where: { id: coachId },
          data: {
            rating: agg._avg.rating ?? 0,
            reviewsCount: agg._count,
          },
        });
      }
    });
    res.status(204).end();
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/reviews — toutes les évaluations pour modération.
router.get(
  '/reviews',
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        coach: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
        booking: { select: { id: true, startsAt: true } },
      },
      take: 500,
    });
    res.json(reviews);
  }),
);

// DELETE /admin/reviews/:id — supprime + recalcule la note du coach concerné.
router.delete(
  '/reviews/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw HttpError.notFound();

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      const agg = await tx.review.aggregate({
        where: { coachId: review.coachId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.coachProfile.update({
        where: { id: review.coachId },
        data: {
          rating: agg._avg.rating ?? 0,
          reviewsCount: agg._count,
        },
      });
    });
    res.status(204).end();
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// STATS / FINANCES
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/stats — KPIs globaux + finances pour la home admin.
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      users,
      clients,
      coaches,
      featured,
      bookings,
      pending,
      confirmed,
      completed,
      cancelled,
      newUsers7d,
      newBookings7d,
      paidAgg,
      paidAgg30,
      refundedAgg,
      reviewsAgg,
      pendingApplications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.CLIENT } }),
      prisma.coachProfile.count(),
      prisma.coachProfile.count({ where: { featured: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      prisma.user.count({ where: { createdAt: { gte: last7 } } }),
      prisma.booking.count({ where: { createdAt: { gte: last7 } } }),
      prisma.booking.aggregate({
        where: { payment: PaymentStatus.PAID },
        _sum: { amount: true, commissionCents: true, payoutCents: true },
        _count: true,
      }),
      prisma.booking.aggregate({
        where: { payment: PaymentStatus.PAID, createdAt: { gte: last30 } },
        _sum: { amount: true, commissionCents: true, payoutCents: true },
      }),
      prisma.booking.aggregate({
        where: { payment: PaymentStatus.REFUNDED },
        _sum: { amount: true, commissionCents: true },
        _count: true,
      }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
      prisma.coachApplication.count({ where: { status: ApplicationStatus.PENDING } }),
    ]);

    const commissionRate = await getCommissionRate();

    res.json({
      users,
      clients,
      coaches,
      featuredCoaches: featured,
      bookings,
      bookingsByStatus: { pending, confirmed, completed, cancelled },
      newUsers7d,
      newBookings7d,
      revenueCents: paidAgg._sum.amount ?? 0,
      commissionCents: paidAgg._sum.commissionCents ?? 0,
      payoutCents: paidAgg._sum.payoutCents ?? 0,
      paidBookings: paidAgg._count,
      revenueCents30d: paidAgg30._sum.amount ?? 0,
      commissionCents30d: paidAgg30._sum.commissionCents ?? 0,
      payoutCents30d: paidAgg30._sum.payoutCents ?? 0,
      refundedCents: refundedAgg._sum.amount ?? 0,
      refundedCount: refundedAgg._count,
      avgRating: reviewsAgg._avg.rating ?? 0,
      reviewsCount: reviewsAgg._count,
      pendingApplications,
      // pour rétro-compat avec /admin (anciennes propriétés)
      completed,
      commissionRate,
    });
  }),
);

// GET /admin/finances/top-coaches — classement par revenus + commission générée.
router.get(
  '/finances/top-coaches',
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.booking.groupBy({
      by: ['coachId'],
      where: { payment: PaymentStatus.PAID },
      _sum: { amount: true, commissionCents: true, payoutCents: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });
    const ids = grouped.map((g) => g.coachId);
    const profiles = await prisma.coachProfile.findMany({
      where: { id: { in: ids } },
      include: { user: { select: { username: true, avatarUrl: true } } },
    });
    const map = new Map(profiles.map((p) => [p.id, p]));
    res.json(
      grouped.map((g) => ({
        coachId: g.coachId,
        coach: map.get(g.coachId),
        revenueCents: g._sum.amount ?? 0,
        commissionCents: g._sum.commissionCents ?? 0,
        payoutCents: g._sum.payoutCents ?? 0,
        bookings: g._count,
      })),
    );
  }),
);

// GET /admin/finances/timeseries — revenus par jour sur N jours (default 30).
router.get(
  '/finances/timeseries',
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days ?? 30), 7), 90);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await prisma.booking.findMany({
      where: { payment: PaymentStatus.PAID, createdAt: { gte: from } },
      select: { createdAt: true, amount: true, commissionCents: true },
    });
    const buckets = new Map<string, { date: string; revenue: number; commission: number; count: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, revenue: 0, commission: 0, count: 0 });
    }
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) {
        b.revenue += r.amount;
        b.commission += r.commissionCents;
        b.count += 1;
      }
    }
    res.json(Array.from(buckets.values()));
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// COACH APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const status = req.query.status as ApplicationStatus | undefined;
    const where = status ? { status } : {};
    const applications = await prisma.coachApplication.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, username: true, email: true, avatarUrl: true } },
        reviewedBy: { select: { id: true, username: true } },
      },
    });
    res.json(applications);
  }),
);

const ReviewSchema = z.object({
  status: z.enum([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]),
  reviewNote: z.string().max(1000).optional(),
});

// PATCH /admin/applications/:id — accepter ou refuser une candidature.
// Sur APPROVED : promote user → COACH + crée CoachProfile à partir de la candidature.
router.patch(
  '/applications/:id',
  validate(ReviewSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const { status, reviewNote } = req.body as z.infer<typeof ReviewSchema>;
    const application = await prisma.coachApplication.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!application) throw HttpError.notFound('Candidature introuvable');
    if (application.status !== ApplicationStatus.PENDING) {
      throw HttpError.badRequest('Cette candidature a déjà été traitée');
    }

    const adminId = req.user!.id;

    if (status === ApplicationStatus.APPROVED) {
      await prisma.$transaction(async (tx) => {
        await tx.coachApplication.update({
          where: { id },
          data: {
            status: ApplicationStatus.APPROVED,
            reviewNote,
            reviewedById: adminId,
            reviewedAt: new Date(),
          },
        });
        await tx.user.update({
          where: { id: application.userId },
          data: { role: Role.COACH },
        });
        await tx.coachProfile.upsert({
          where: { userId: application.userId },
          update: {
            rank: application.rank,
            description: application.description,
            hourlyRate: application.hourlyRate,
            specialties: application.specialties,
          },
          create: {
            userId: application.userId,
            rank: application.rank,
            description: application.description,
            hourlyRate: application.hourlyRate,
            specialties: application.specialties,
          },
        });
      });
    } else {
      await prisma.coachApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.REJECTED,
          reviewNote,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
    }

    res.json({ ok: true });
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const commissionRate = await getSetting<number>(SETTING_KEYS.COMMISSION_RATE, 0.2);
    res.json({ commissionRate });
  }),
);

const UpdateSettingsSchema = z.object({
  commissionRate: z.number().min(0).max(0.6).optional(),
});

router.patch(
  '/settings',
  validate(UpdateSettingsSchema),
  asyncHandler(async (req, res) => {
    const { commissionRate } = req.body as z.infer<typeof UpdateSettingsSchema>;
    if (commissionRate !== undefined) {
      await setSetting(SETTING_KEYS.COMMISSION_RATE, commissionRate);
    }
    const next = await getSetting<number>(SETTING_KEYS.COMMISSION_RATE, 0.2);
    res.json({ commissionRate: next });
  }),
);

// POST /admin/settings/recompute-commissions — recalcule commission/payout
// sur toutes les bookings existantes, en utilisant le taux courant ou un
// taux fourni. Utile après un changement de taux pour normaliser l'historique.
const RecomputeSchema = z.object({
  rate: z.number().min(0).max(0.6).optional(),
  scope: z.enum(['all', 'paid']).optional(),
});
router.post(
  '/settings/recompute-commissions',
  validate(RecomputeSchema),
  asyncHandler(async (req, res) => {
    const { rate, scope = 'paid' } = req.body as z.infer<typeof RecomputeSchema>;
    const effectiveRate = rate ?? (await getCommissionRate());
    const where =
      scope === 'paid' ? { payment: PaymentStatus.PAID } : ({} as Record<string, never>);
    const bookings = await prisma.booking.findMany({
      where,
      select: { id: true, amount: true },
    });
    await prisma.$transaction(
      bookings.map((b) => {
        const { commissionCents, payoutCents } = computeCommission(b.amount, effectiveRate);
        return prisma.booking.update({
          where: { id: b.id },
          data: { commissionRate: effectiveRate, commissionCents, payoutCents },
        });
      }),
    );
    res.json({ updated: bookings.length, rate: effectiveRate });
  }),
);

export default router;
