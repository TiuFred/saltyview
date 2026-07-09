import 'dotenv/config';
import { BearerTokenAuthenticator, SmartThingsClient } from '@smartthings/core-sdk';

async function main() {
  const pat = process.env.SMARTTHINGS_PAT;
  if (!pat) {
    console.error('Defina SMARTTHINGS_PAT no .env antes de rodar este script.');
    process.exit(1);
  }

  const client = new SmartThingsClient(new BearerTokenAuthenticator(pat));
  const devices = await client.devices.list();

  console.log(`Encontrados ${devices.length} dispositivo(s) na sua conta SmartThings:\n`);
  for (const device of devices) {
    console.log(`- ${device.label ?? device.name} (deviceId: ${device.deviceId})`);
  }
}

main().catch((error) => {
  console.error('Falha ao listar dispositivos SmartThings:', error.message ?? error);
  process.exit(1);
});
