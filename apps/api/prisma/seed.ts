import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Fred';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'fred@home.local';
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
