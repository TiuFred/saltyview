import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ADMIN_NAME_ALIASES = ['Administrador', 'adm', 'Admin'];
const LEGACY_ADMIN_EMAIL = 'admin@example.com';

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Administrador';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me';
  const adminPin = process.env.SEED_ADMIN_PIN ?? '0000';

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const pinHash = await bcrypt.hash(adminPin, 12);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { email: LEGACY_ADMIN_EMAIL },
        ...ADMIN_NAME_ALIASES.map((name) => ({ name })),
      ],
    },
  });

  const admin = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          pinHash,
        },
      })
    : await prisma.user.create({
        data: { name: adminName, email: adminEmail, passwordHash, pinHash },
      });
  console.log(`Usuário admin pronto: ${admin.email}`);

  const tagNames = ['LG', 'Samsung', 'Ar Condicionado', 'Televisão', 'Sala', 'Quartos'];
  for (const name of tagNames) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Tags padrão prontas: ${tagNames.join(', ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
