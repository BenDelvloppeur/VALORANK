import { createClient } from '@supabase/supabase-js';
import { PrismaClient, Role, ValorantRank } from '@prisma/client';
import 'dotenv/config';

// Provisionne (ou réinitialise) les comptes Supabase Auth des coachs de démo
// créés par `npm run seed`, et synchronise leur ligne Prisma User pour que
// l'id corresponde à auth.users.id (sinon impossible de se connecter).
//
// Usage : npm run create-coach-accounts
//
// Variables d'environnement supportées :
//   COACH_PASSWORD (défaut : ChangeMe!2026) — mot de passe commun à tous les coachs

const password = process.env.COACH_PASSWORD ?? 'ChangeMe!2026';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

// Doit rester aligné avec prisma/seed.ts
const COACHES = [
  { username: 'Phantom', email: 'phantom@valorank.gg', rank: ValorantRank.RADIANT },
  { username: 'Vyx', email: 'vyx@valorank.gg', rank: ValorantRank.IMMORTAL },
  { username: 'Sova_Main', email: 'sova@valorank.gg', rank: ValorantRank.ASCENDANT },
  { username: 'Mental_Coach', email: 'mental@valorank.gg', rank: ValorantRank.DIAMOND },
  { username: 'AimGod', email: 'aimgod@valorank.gg', rank: ValorantRank.IMMORTAL },
  { username: 'NoobSlayer', email: 'slayer@valorank.gg', rank: ValorantRank.PLATINUM },
];

async function provisionCoach(c: (typeof COACHES)[number]) {
  console.log(`👤 ${c.username} (${c.email})`);

  // 1) Nettoie une éventuelle ligne Prisma orpheline avec un id qui n'existe
  // pas dans auth.users (créée par le seed avec un UUID factice).
  const orphan = await prisma.user.findUnique({ where: { email: c.email } });
  if (orphan) {
    const exists = await supabase.auth.admin.getUserById(orphan.id);
    if (exists.error || !exists.data.user) {
      console.log('   - Ligne Prisma orpheline détectée → migration de l\'id');
      // On supprime la ligne (et son CoachProfile en cascade) pour pouvoir
      // recréer avec le bon id auth. Les disponibilités tombent aussi en cascade.
      await prisma.user.delete({ where: { id: orphan.id } });
    }
  }

  // 2) Crée ou récupère le user Supabase Auth, auto-confirmé.
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === c.email);

  let userId: string;
  if (existing) {
    console.log('   - Auth user existant → reset du mot de passe');
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: c.email,
      password,
      email_confirm: true,
      user_metadata: { username: c.username, role: 'COACH' },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`   - Auth user créé : ${userId}`);
  }

  // 3) Upsert Prisma avec l'id auth
  await prisma.user.upsert({
    where: { id: userId },
    update: { role: Role.COACH, email: c.email, username: c.username },
    create: { id: userId, email: c.email, username: c.username, role: Role.COACH },
  });

  // 4) Garantit qu'un CoachProfile existe (relancer le seed le complète/met à jour)
  await prisma.coachProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      rank: c.rank,
      description: `Coach ${c.username} — profil de démo.`,
      hourlyRate: 2500,
      specialties: ['GAME_SENSE'],
    },
  });
}

async function main() {
  console.log('🎮 Provision des comptes coachs de démo…\n');
  for (const c of COACHES) {
    await provisionCoach(c);
  }
  console.log(`\n✅ Comptes prêts. Mot de passe commun : ${password}\n`);
  console.log('Connecte-toi sur http://localhost:3000/sign-in avec :');
  for (const c of COACHES) {
    console.log(`   - ${c.email}  (${c.username})`);
  }
  console.log('\nℹ️  Pense à relancer `npm run seed` ensuite pour recréer les');
  console.log('   disponibilités et descriptions complètes des coachs migrés.');
}

main()
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
