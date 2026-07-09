# Casa — Central de Automação Residencial

Sistema próprio de automação residencial (sem depender da UI padrão do Home Assistant), com
dashboard web moderno e integração direta com as APIs oficiais dos fabricantes dos aparelhos.

## Escopo da Fase 1

- Dashboard geral (sem telas por cômodo ainda) com login multi-usuário.
- Controle de 2 dispositivos: **TV Samsung QN75QEF1AGXZD** (via SmartThings) e **Ar-condicionado LG**
  (via LG ThinQ Connect).
- Tudo operando em rede local, sem exposição à internet.
- Cômodos, cenas e automações (editor SE/ENTÃO) ficam para as próximas fases — o schema do banco já
  está preparado para elas (`Room` já modelado).

## Arquitetura

Monorepo com npm workspaces:

```
casa/
├── apps/
│   ├── api/    # NestJS — REST + WebSocket + integrações
│   └── web/    # Next.js — dashboard
├── packages/
│   ├── shared-types/       # DTOs e tipos compartilhados entre api e web
│   └── device-contracts/   # Interface DeviceProvider comum aos adapters
└── docker-compose.yml
```

- **Backend**: NestJS, PostgreSQL (via Prisma), Redis (cache de estado/sessão), WebSocket (Socket.IO)
  para atualização de estado em tempo real, JWT (access + refresh) para autenticação.
- **Integrações**: cada fabricante tem um adapter isolado atrás da interface `DeviceProvider`
  (`packages/device-contracts`), então trocar/adicionar um fabricante não exige tocar no domínio de
  devices.
  - `SmartThingsProvider` — usa o SDK oficial `@smartthings/core-sdk` com um Personal Access Token.
  - `LgThinqProvider` — usa o SDK oficial `thinqconnect` (LG ThinQ Connect) com um Personal Access
    Token e Client ID próprios.
- **Frontend**: Next.js (App Router) + TailwindCSS + Framer Motion, cliente WebSocket para refletir
  mudanças de estado feitas fora do app (ex: controle remoto físico).

## Pré-requisitos

- Node.js 22+
- Docker + Docker Compose (recomendado) **ou** PostgreSQL 16 e Redis instalados localmente
- Um Personal Access Token do [SmartThings](https://account.smartthings.com/tokens)
- Um Personal Access Token do [LG ThinQ Developer Site](https://smartsolution.developer.lge.com) (ThinQ Connect)

## Configuração

```bash
cp .env.example .env
```

Preencha no `.env`:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — gere com `openssl rand -hex 32`.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — credenciais do primeiro usuário administrador.
- `SMARTTHINGS_PAT` — Personal Access Token do SmartThings (escopos de leitura/execução de devices).
- `LG_THINQ_PAT` — Personal Access Token do ThinQ Connect.
- `LG_THINQ_CLIENT_ID` — gere **uma vez** com `node -e "console.log(crypto.randomUUID())"` e não
  regenere depois (a LG recomenda um Client ID estável por instalação).
- `LG_THINQ_COUNTRY` — código do país (ex: `BR`).

## Rodando com Docker (recomendado)

```bash
docker compose up --build
```

- API: http://localhost:3001
- Web: http://localhost:3000

Na primeira execução, rode as migrations e o seed dentro do container da API:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed
```

## Rodando localmente sem Docker

```bash
npm install

# Suba Postgres e Redis por conta própria (ex: via Homebrew) e ajuste DATABASE_URL/REDIS_URL no .env

npm run prisma:migrate -- --name init
npm run prisma:seed

npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:3000
```

## Vinculando os dispositivos

Os 2 dispositivos da Fase 1 já existem no banco (via seed) mas começam **desvinculados**
(`externalId` nulo), aparecendo como offline no dashboard. Para vincular:

1. Cadastre a TV no app SmartThings e o ar-condicionado no app LG ThinQ normalmente (como faria para
   controlar pelo app do fabricante).
2. Preencha `SMARTTHINGS_PAT` e `LG_THINQ_PAT`/`LG_THINQ_CLIENT_ID`/`LG_THINQ_COUNTRY` no `.env`.
3. Liste os dispositivos da sua conta para descobrir o `deviceId` de cada um:

   ```bash
   npm run devices:list:smartthings --workspace=@casa/api
   npm run devices:list:thinq --workspace=@casa/api
   ```

4. Vincule cada dispositivo interno (`seed-tv-samsung` / `seed-ac-lg`) ao `deviceId` real:

   ```bash
   npm run devices:link --workspace=@casa/api -- seed-tv-samsung <deviceId-da-tv>
   npm run devices:link --workspace=@casa/api -- seed-ac-lg <deviceId-do-ar>
   ```

5. Recarregue o dashboard — o dispositivo passa a refletir o estado real do aparelho.

## Adicionando novos dispositivos

- **Mesmo tipo/provider já suportado** (outra TV Samsung, outro AC LG): basta cadastrar e vincular, sem
  código novo:

  ```bash
  npm run devices:add --workspace=@casa/api -- "TV Samsung Quarto" TV SMARTTHINGS
  # descubra o deviceId com devices:list:smartthings / devices:list:thinq, depois:
  npm run devices:link --workspace=@casa/api -- <id-retornado-pelo-add> <deviceId-do-fabricante>
  ```

- **Tipo de dispositivo novo** (luz, tomada, fechadura, cortina, câmera, etc.): exige um adapter de
  integração novo (`DeviceProvider`) e um card novo no frontend, seguindo o mesmo padrão de
  `SmartThingsProvider`/`LgThinqProvider` e `TVCard`/`ACCard`.

## Testes

```bash
npm run test --workspace=@casa/api       # unitários (auth, devices)
npm run test:e2e --workspace=@casa/api   # integração HTTP com providers mockados
```

## Próximas fases

- Fase 2: cômodos (schema `Room` já existe) e mais dispositivos.
- Fase 3: cenas.
- Fase 4: editor visual de automações (SE/ENTÃO).
- Fase 5: 2FA, permissões granulares por usuário, painel de auditoria completo, app mobile (React Native).

## Riscos conhecidos

- A integração LG ThinQ usa o SDK oficial, mas os nomes exatos de campos de estado
  (`airConJobMode`, `temperature`, `airFlow`, etc.) devem ser confirmados contra o dispositivo real do
  usuário na primeira integração — ver comentários em `apps/api/src/integrations/lg-thinq/`.
- Os app IDs do capability `custom.launchapp` (Netflix/YouTube/Prime/Disney+) da TV Samsung podem
  variar por modelo/região — ver `apps/api/src/integrations/smartthings/samsung-tv-apps.ts`.
