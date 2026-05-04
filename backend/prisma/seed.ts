import { PrismaClient, Role, ValorantRank } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

const SAMPLE_COACHES = [
  {
    username: 'Phantom',
    email: 'phantom@valorank.gg',
    rank: ValorantRank.RADIANT,
    description:
      'Ex-VCT player. Spécialisé dans le crosshair placement et les peeks décisifs en post-plant.',
    hourlyRate: 5000,
    specialties: ['AIM', 'GAME_SENSE'],
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Phantom',
  },
  {
    username: 'Vyx',
    email: 'vyx@valorank.gg',
    rank: ValorantRank.IMMORTAL,
    description:
      'Coach IGL : appels, exécutés, mid-round adaptations. On bosse ton macro game.',
    hourlyRate: 3500,
    specialties: ['STRATEGY', 'GAME_SENSE'],
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Vyx',
  },
  {
    username: 'Sova_Main',
    email: 'sova@valorank.gg',
    rank: ValorantRank.ASCENDANT,
    description:
      'Ligne par ligne, je te transforme en main Sentinel ou Initiator. Lineups inclus.',
    hourlyRate: 2500,
    specialties: ['AGENT_MASTERY', 'GAME_SENSE'],
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Sova',
  },
  {
    username: 'Mental_Coach',
    email: 'mental@valorank.gg',
    rank: ValorantRank.DIAMOND,
    description:
      'Spécialiste mindset & tilt management. On débloque ton plafond mental, pas que ton aim.',
    hourlyRate: 2000,
    specialties: ['MENTAL'],
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Mental',
  },
  {
    username: 'AimGod',
    email: 'aimgod@valorank.gg',
    rank: ValorantRank.IMMORTAL,
    description:
      'Routines Aim Lab personnalisées. On vise la précision millimétrée.',
    hourlyRate: 3000,
    specialties: ['AIM'],
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=AimGod',
  },
  {
    username: 'NoobSlayer',
    email: 'slayer@valorank.gg',
    rank: ValorantRank.PLATINUM,
    description:
      'Coach Iron → Plat. Pédagogie, patience, bases solides. Idéal pour débuter sérieusement.',
    hourlyRate: 1500,
    specialties: ['GAME_SENSE', 'AGENT_MASTERY'],
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=Noob',
  },
];

function generateAvailabilities(coachId: string) {
  const slots: { coachId: string; startsAt: Date; endsAt: Date }[] = [];
  const now = new Date();
  for (let day = 1; day <= 14; day++) {
    const base = new Date(now);
    base.setDate(now.getDate() + day);
    base.setHours(18, 0, 0, 0);
    for (let i = 0; i < 4; i++) {
      const startsAt = new Date(base.getTime() + i * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
      slots.push({ coachId, startsAt, endsAt });
    }
  }
  return slots;
}

async function main() {
  console.log('🌱 Seeding database…');

  // Coachs (id factice — en prod ces ids viennent de Supabase Auth)
  for (const c of SAMPLE_COACHES) {
    const userId = randomUUID();
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        id: userId,
        email: c.email,
        username: c.username,
        avatarUrl: c.avatarUrl,
        role: Role.COACH,
      },
    });

    const profile = await prisma.coachProfile.upsert({
      where: { userId: user.id },
      update: {
        rank: c.rank,
        description: c.description,
        hourlyRate: c.hourlyRate,
        specialties: c.specialties,
      },
      create: {
        userId: user.id,
        rank: c.rank,
        description: c.description,
        hourlyRate: c.hourlyRate,
        specialties: c.specialties,
      },
    });

    const existing = await prisma.availability.count({
      where: { coachId: profile.id },
    });
    if (existing === 0) {
      await prisma.availability.createMany({
        data: generateAvailabilities(profile.id),
      });
    }
  }

  // Compte admin de démonstration
  const adminEmail = 'admin@valorank.gg';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      id: randomUUID(),
      email: adminEmail,
      username: 'admin',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Seed terminé.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
