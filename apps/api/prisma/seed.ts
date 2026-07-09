import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Admin';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me';
  const adminPin = process.env.SEED_ADMIN_PIN ?? '0000';

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const pinHash = await bcrypt.hash(adminPin, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { pinHash },
    create: { name: adminName, email: adminEmail, passwordHash, pinHash },
  });
  console.log(`Usuário admin pronto: ${admin.email}`);

  await prisma.device.upsert({
    where: { id: 'seed-tv-samsung' },
    update: {},
    create: {
      id: 'seed-tv-samsung',
      name: 'TV Samsung QN75QEF1AGXZD',
      type: 'TV',
      provider: 'SMARTTHINGS',
      externalId: null,
      online: false,
    },
  });

  await prisma.device.upsert({
    where: { id: 'seed-ac-lg' },
    update: {},
    create: {
      id: 'seed-ac-lg',
      name: 'Ar-condicionado LG',
      type: 'AC',
      provider: 'LG_THINQ',
      externalId: null,
      online: false,
    },
  });

  console.log('Dispositivos da Fase 1 (TV Samsung, AC LG) prontos — vincule o externalId depois de cadastrar cada aparelho no app do fabricante.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
