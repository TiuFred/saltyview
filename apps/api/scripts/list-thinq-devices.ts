import 'dotenv/config';
import { ThinQApi } from 'thinqconnect';

async function main() {
  const pat = process.env.LG_THINQ_PAT;
  const country = process.env.LG_THINQ_COUNTRY;
  const clientId = process.env.LG_THINQ_CLIENT_ID;

  if (!pat || !country || !clientId) {
    console.error('Defina LG_THINQ_PAT, LG_THINQ_COUNTRY e LG_THINQ_CLIENT_ID no .env antes de rodar este script.');
    process.exit(1);
  }

  const api = new ThinQApi(pat, country, clientId);
  const response = await api.asyncGetDeviceList();

  if (response.status !== 200) {
    console.error('Falha ao listar dispositivos LG ThinQ:', response.errorCode, response.errorMessage);
    process.exit(1);
  }

  console.log('Dispositivos encontrados na sua conta LG ThinQ (procure o "deviceId" do seu ar-condicionado):\n');
  console.log(JSON.stringify(response.body, null, 2));
}

main().catch((error) => {
  console.error('Falha ao listar dispositivos LG ThinQ:', error.message ?? error);
  process.exit(1);
});
