import { Router } from 'express';
import { BookingStatus, PaymentStatus, Prisma, ValorantRank } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/HttpError.js';
import { validate } from '../../utils/validate.js';

const router: Router = Router();

// Helper : retourne le CoachProfile du user courant ou throw 404.
async function getMyCoachProfile(userId: string) {
  const profile = await prisma.coachProfile.findUnique({ where: { userId } });
  if (!profile) throw HttpError.notFound('Profil coach introuvable');
  return profile;
}

const ListQuerySchema = z.object({
  rank: z.nativeEnum(ValorantRank).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  specialty: z.string().optional(),
  date: z.coerce.date().optional(),
  search: z.string().optional(),
  sort: z.enum(['rating', 'price_asc', 'price_desc', 'recent']).default('rating'),
});

// GET /coaches — listing public avec filtres.
router.get(
  '/',
  validate(ListQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof ListQuerySchema>;

    const where: Prisma.CoachProfileWhereInput = {};
    if (q.rank) where.rank = q.rank;
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.hourlyRate = {};
      if (q.minPrice !== undefined) where.hourlyRate.gte = q.minPrice;
      if (q.maxPrice !== undefined) where.hourlyRate.lte = q.maxPrice;
    }
    if (q.specialty) where.specialties = { has: q.specialty };
    if (q.search) {
      where.user = {
        username: { contains: q.search, mode: 'insensitive' },
      };
    }
    if (q.date) {
      const dayStart = new Date(q.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.availabilities = {
        some: { startsAt: { gte: dayStart, lt: dayEnd }, isBooked: false },
      };
    }

    // Les coachs "featured" remontent toujours en premier, indépendamment du tri choisi.
    const sortKey: Prisma.CoachProfileOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { hourlyRate: 'asc' }
        : q.sort === 'price_desc'
          ? { hourlyRate: 'desc' }
          : q.sort === 'recent'
            ? { createdAt: 'desc' }
            : { rating: 'desc' };

    const orderBy: Prisma.CoachProfileOrderByWithRelationInput[] = [
      { featured: 'desc' },
      sortKey,
    ];

    const coaches = await prisma.coachProfile.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      take: 50,
    });

    res.json(coaches);
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// COACH DASHBOARD — endpoints "/coaches/me/*" doivent être déclarés AVANT
// la route paramétrée "/:id" sinon Express les interprète comme un id.
// ─────────────────────────────────────────────────────────────────────────────

// GET /coaches/me/stats — KPIs personnels du coach connecté.
router.get(
  '/me/stats',
  requireAuth(),
  requireRole('COACH'),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const profile = await getMyCoachProfile(userId);
    const coachId = profile.id;

    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      upcoming,
      paidAgg,
      paidAgg30d,
      reviewsAgg,
      uniqueClients,
      newBookings7d,
      avSlots,
      bookedSlots,
    ] = await Promise.all([
      prisma.booking.count({ where: { coachId } }),
      prisma.booking.count({ where: { coachId, status: BookingStatus.PENDING } }),
      prisma.booking.count({ where: { coachId, status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { coachId, status: BookingStatus.COMPLETED } }),
      prisma.booking.count({ where: { coachId, status: BookingStatus.CANCELLED } }),
      prisma.booking.count({
        where: {
          coachId,
          startsAt: { gte: now },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
      }),
      prisma.booking.aggregate({
        where: { coachId, payment: PaymentStatus.PAID },
        _sum: { amount: true, commissionCents: true, payoutCents: true },
        _count: true,
      }),
      prisma.booking.aggregate({
        where: { coachId, payment: PaymentStatus.PAID, createdAt: { gte: last30 } },
        _sum: { amount: true, commissionCents: true, payoutCents: true },
        _count: true,
      }),
      prisma.review.aggregate({
        where: { coachId },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.booking.findMany({
        where: { coachId },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
      prisma.booking.count({ where: { coachId, createdAt: { gte: last7 } } }),
      prisma.availability.count({ where: { coachId, startsAt: { gte: now } } }),
      prisma.availability.count({
        where: { coachId, startsAt: { gte: now }, isBooked: true },
      }),
    ]);

    // Distribution des notes 1..5
    const distinctRatings = await prisma.review.groupBy({
      by: ['rating'],
      where: { coachId },
      _count: true,
    });
    const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const r of distinctRatings) {
      ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5] = r._count;
    }

    // Prochaine session
    const nextBooking = await prisma.booking.findFirst({
      where: {
        coachId,
        startsAt: { gte: now },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        client: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.json({
      profile: {
        id: profile.id,
        rating: profile.rating,
        reviewsCount: profile.reviewsCount,
        featured: profile.featured,
        hourlyRate: profile.hourlyRate,
      },
      bookings: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        upcoming,
        newBookings7d,
      },
      finance: {
        revenueCents: paidAgg._sum.amount ?? 0,
        commissionCents: paidAgg._sum.commissionCents ?? 0,
        payoutCents: paidAgg._sum.payoutCents ?? 0,
        paidBookings: paidAgg._count,
        revenueCents30d: paidAgg30d._sum.amount ?? 0,
        commissionCents30d: paidAgg30d._sum.commissionCents ?? 0,
        payoutCents30d: paidAgg30d._sum.payoutCents ?? 0,
        paidBookings30d: paidAgg30d._count,
      },
      availability: {
        upcomingSlots: avSlots,
        bookedSlots,
        freeSlots: avSlots - bookedSlots,
      },
      reviews: {
        avg: reviewsAgg._avg.rating ?? 0,
        count: reviewsAgg._count,
        distribution: ratingDistribution,
      },
      uniqueClients: uniqueClients.length,
      nextBooking,
    });
  }),
);

// GET /coaches/me/timeseries?days=30 — revenus / payouts jour par jour.
router.get(
  '/me/timeseries',
  requireAuth(),
  requireRole('COACH'),
  asyncHandler(async (req, res) => {
    const profile = await getMyCoachProfile(req.user!.id);
    const days = Math.min(Math.max(Number(req.query.days ?? 30), 7), 90);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await prisma.booking.findMany({
      where: { coachId: profile.id, payment: PaymentStatus.PAID, createdAt: { gte: from } },
      select: { createdAt: true, amount: true, commissionCents: true, payoutCents: true },
    });
    const buckets = new Map<
      string,
      { date: string; revenue: number; payout: number; commission: number; count: number }
    >();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, revenue: 0, payout: 0, commission: 0, count: 0 });
    }
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) {
        b.revenue += r.amount;
        b.payout += r.payoutCents;
        b.commission += r.commissionCents;
        b.count += 1;
      }
    }
    res.json(Array.from(buckets.values()));
  }),
);

// GET /coaches/me/clients — top clients du coach connecté.
router.get(
  '/me/clients',
  requireAuth(),
  requireRole('COACH'),
  asyncHandler(async (req, res) => {
    const profile = await getMyCoachProfile(req.user!.id);
    const grouped = await prisma.booking.groupBy({
      by: ['clientId'],
      where: { coachId: profile.id },
      _sum: { amount: true, payoutCents: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 50,
    });
    const ids = grouped.map((g) => g.clientId);
    const clients = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, avatarUrl: true, createdAt: true },
    });
    const lastBookings = await prisma.booking.findMany({
      where: { coachId: profile.id, clientId: { in: ids } },
      orderBy: { startsAt: 'desc' },
      distinct: ['clientId'],
      select: { clientId: true, startsAt: true, status: true },
    });
    const lastMap = new Map(lastBookings.map((b) => [b.clientId, b]));
    const map = new Map(clients.map((c) => [c.id, c]));
    res.json(
      grouped.map((g) => ({
        clientId: g.clientId,
        client: map.get(g.clientId),
        bookings: g._count,
        revenueCents: g._sum.amount ?? 0,
        payoutCents: g._sum.payoutCents ?? 0,
        lastSession: lastMap.get(g.clientId) ?? null,
      })),
    );
  }),
);

// GET /coaches/me/reviews — avis reçus par le coach connecté.
router.get(
  '/me/reviews',
  requireAuth(),
  requireRole('COACH'),
  asyncHandler(async (req, res) => {
    const profile = await getMyCoachProfile(req.user!.id);
    const reviews = await prisma.review.findMany({
      where: { coachId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        booking: { select: { id: true, startsAt: true } },
      },
    });
    res.json(reviews);
  }),
);

// GET /coaches/:id — profil public détaillé d'un coach (id = CoachProfile.id).
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const coach = await prisma.coachProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true, email: false },
        },
        availabilities: {
          where: { isBooked: false, startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
          take: 100,
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            author: { select: { username: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!coach) throw HttpError.notFound('Coach introuvable');
    res.json(coach);
  }),
);

const UpdateSchema = z.object({
  rank: z.nativeEnum(ValorantRank).optional(),
  description: z.string().min(20).max(1000).optional(),
  hourlyRate: z.number().int().min(500).max(50000).optional(),
  specialties: z.array(z.string()).min(1).max(8).optional(),
  avatarUrl: z.string().url().optional(),
});

// PUT /coaches/me — un coach met à jour son profil, ou le crée s'il n'existe pas
// (cas d'un user promu COACH a posteriori, ou d'un sync incomplet).
router.put(
  '/me',
  requireAuth(),
  requireRole('COACH'),
  validate(UpdateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { avatarUrl, ...rest } = req.body as z.infer<typeof UpdateSchema>;

    const profile = await prisma.coachProfile.upsert({
      where: { userId },
      update: rest,
      create: {
        userId,
        rank: rest.rank ?? 'IRON',
        description: rest.description ?? 'Nouveau coach. Pense à compléter ton profil.',
        hourlyRate: rest.hourlyRate ?? 2000,
        specialties: rest.specialties ?? ['AIM'],
      },
    });

    if (avatarUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });
    }

    res.json(profile);
  }),
);

export default router;
