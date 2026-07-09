import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const [deviceId, externalId] = process.argv.slice(2);

  if (!deviceId || !externalId) {
    console.error('Uso: npm run devices:link --workspace=@casa/api -- <deviceId-interno> <externalId-do-fabricante>');
    console.error('Exemplo: npm run devices:link --workspace=@casa/api -- seed-tv-samsung abc123-device-id');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const device = await prisma.device.update({
    where: { id: deviceId },
    data: { externalId },
  });

  console.log(`Dispositivo "${device.name}" vinculado ao externalId "${externalId}".`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Falha ao vincular dispositivo:', error.message ?? error);
  process.exit(1);
});
