import { createClient } from '@supabase/supabase-js';
import { PrismaClient, Role } from '@prisma/client';
import 'dotenv/config';

// Crée (ou réinitialise) un compte admin :
// - utilisateur Supabase Auth avec email auto-confirmé
// - ligne Prisma User avec role=ADMIN et id matchant l'auth.users.id
//
// Variables d'environnement supportées :
//   ADMIN_EMAIL    (défaut : admin@valorank.gg)
//   ADMIN_PASSWORD (défaut : ChangeMe!2026)

const email = process.env.ADMIN_EMAIL ?? 'admin@valorank.gg';
const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe!2026';
const username = 'admin';

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

async function main() {
  console.log(`👑 Provision de l'admin ${email}…`);

  // 1) Nettoie une éventuelle ligne Prisma orpheline avec cet email
  // (ex : créée par le seed avec un UUID qui ne correspond à aucun auth.users)
  const orphan = await prisma.user.findUnique({ where: { email } });
  if (orphan) {
    const exists = await supabase.auth.admin.getUserById(orphan.id);
    if (exists.error || !exists.data.user) {
      console.log(`   - Suppression de la ligne Prisma orpheline ${orphan.id}`);
      await prisma.user.delete({ where: { id: orphan.id } });
    }
  }

  // 2) Crée ou récupère l'utilisateur Supabase Auth (auto-confirmé)
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);

  let userId: string;
  if (existing) {
    console.log(`   - Auth user existant détecté, reset du password`);
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role: 'ADMIN' },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`   - Auth user créé : ${userId}`);
  }

  // 3) Upsert de la ligne Prisma avec le bon id
  await prisma.user.upsert({
    where: { id: userId },
    update: { role: Role.ADMIN, email, username },
    create: { id: userId, email, username, role: Role.ADMIN },
  });

  console.log(`✅ Admin prêt.

   Email    : ${email}
   Password : ${password}
   Connecte-toi sur http://localhost:3000/sign-in
`);
}

main()
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
