import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const VALID_TYPES = ['TV', 'AC'];
const VALID_PROVIDERS = ['SMARTTHINGS', 'LG_THINQ'];

async function main() {
  const [name, type, provider, externalId] = process.argv.slice(2);

  if (!name || !type || !provider) {
    console.error('Uso: npm run devices:add --workspace=@casa/api -- "<nome>" <TV|AC> <SMARTTHINGS|LG_THINQ> [externalId]');
    console.error('Exemplo: npm run devices:add --workspace=@casa/api -- "TV Samsung Quarto" TV SMARTTHINGS');
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type)) {
    console.error(`Tipo inválido "${type}". Use um de: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  if (!VALID_PROVIDERS.includes(provider)) {
    console.error(`Provider inválido "${provider}". Use um de: ${VALID_PROVIDERS.join(', ')}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const device = await prisma.device.create({
    data: {
      name,
      type: type as 'TV' | 'AC',
      provider: provider as 'SMARTTHINGS' | 'LG_THINQ',
      externalId: externalId ?? null,
    },
  });

  console.log(`Dispositivo "${device.name}" criado com id "${device.id}".`);
  if (!externalId) {
    console.log('Ainda não vinculado — rode devices:list:smartthings ou devices:list:thinq para achar o externalId e depois devices:link.');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Falha ao adicionar dispositivo:', error.message ?? error);
  process.exit(1);
});
