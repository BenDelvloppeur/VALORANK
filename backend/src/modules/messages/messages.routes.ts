import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/HttpError.js';
import { validate } from '../../utils/validate.js';

const router: Router = Router();

const CreateSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Vérifie l'accès à la conversation.
// - Client / coach de la booking : OK
// - Admin : OK (lecture ET intervention pour la modération)
async function assertParticipantOrAdmin(
  bookingId: string,
  user: { id: string; role: string },
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { coach: true },
  });
  if (!booking) throw HttpError.notFound();
  if (user.role === 'ADMIN') return booking;
  const isClient = booking.clientId === user.id;
  const isCoach = booking.coach.userId === user.id;
  if (!isClient && !isCoach) throw HttpError.forbidden();
  return booking;
}

// Champs renvoyés pour l'expéditeur d'un message (incluant le rôle pour
// distinguer visuellement les interventions admin côté UI).
const senderSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  role: true,
} as const;

// GET /messages/:bookingId — historique chat (participants OU admin).
router.get(
  '/:bookingId',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const bookingId = req.params.bookingId!;
    await assertParticipantOrAdmin(bookingId, req.user!);
    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: senderSelect } },
    });
    res.json(messages);
  }),
);

// POST /messages/:bookingId — envoie un message (participants OU admin pour modération).
// L'INSERT déclenche Supabase Realtime côté frontend (canal sur la table Message).
router.post(
  '/:bookingId',
  requireAuth(),
  validate(CreateSchema),
  asyncHandler(async (req, res) => {
    const bookingId = req.params.bookingId!;
    await assertParticipantOrAdmin(bookingId, req.user!);
    const { content } = req.body as z.infer<typeof CreateSchema>;

    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId: req.user!.id,
        content,
      },
      include: { sender: { select: senderSelect } },
    });

    res.status(201).json(message);
  }),
);

export default router;
