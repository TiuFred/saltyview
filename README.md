# Casa — Central de Automação Residencial 🏠

Sistema próprio de automação residencial (sem depender da UI padrão do Home Assistant), com dashboard web moderno e integração direta com as APIs oficiais dos fabricantes dos aparelhos.

## ✨ O que foi implementado

### ✅ Fase 1 (Completa)
- Dashboard web com login **multi-usuário PIN-based** (4 dígitos)
- Controle de **2 tipos de dispositivos**:
  - **TV Samsung** (via SmartThings SDK oficial)
  - **Ar-condicionado LG** (via LG ThinQ Connect SDK oficial)
- **Device Discovery**: descoberta automática de devices na conta do usuário
- **Device Management** (admin-only):
  - Renomear dispositivos
  - Deletar dispositivos
  - Sincronizar estado em tempo real
- **AC Remote Control**: interface de controle remoto redesenhada com design Samsung
- **Autenticação JWT** com access (15min) + refresh (7 dias) tokens
- **Realtime Updates**: Socket.IO para refletir mudanças de estado instantaneamente
- **Admin vs User Roles**: controles administrativos restritos

### 🎯 Escopo
- Tudo operando em rede local, sem exposição à internet
- Cômodos, cenas e automações (SE/ENTÃO) ficam para próximas fases — schema do banco já preparado

## 🏗️ Stack Técnico Completo

### Backend (NestJS 11 + TypeScript)
```
API (port 3001)
├── Auth Module
│   ├── PIN-based login (bcrypt hashed)
│   ├── JWT strategy (access + refresh tokens)
│   └── User listing for login UI
├── Devices Module
│   ├── Device CRUD (create, read, update, delete)
│   ├── Device discovery (SmartThings + LG ThinQ)
│   ├── Command execution via providers
│   └── Device state sync + logs
├── Integrations
│   ├── SmartThingsProvider (Samsung TV/AC)
│   │   ├── Device discovery with capability detection
│   │   ├── Type inference (TV vs AC based on capabilities)
│   │   ├── Power control, volume, mute, input, app launch
│   │   └── AC: mode, fan speed, temperature, swing
│   └── LgThinqProvider (LG AC)
│       ├── Device discovery
│       ├── Power control
│       └── Temperature, mode, fan speed, swing
├── Realtime Module (Socket.IO)
│   └── Push updates on device state changes
├── Database (Prisma 6 + PostgreSQL 16)
│   ├── User (id, name, email, passwordHash, pinHash)
│   ├── Device (id, name, type, provider, externalId, state, online)
│   └── DeviceLog (device activity history)
└── Cache (Redis)
    └── Device state caching + session store
```

### Frontend (Next.js 16 + React 19 + TypeScript)
```
Web App (port 3000)
├── Login Page
│   ├── User dropdown (fetched from API)
│   └── 4-digit PIN entry (auto-focus between fields)
├── Dashboard
│   ├── Device list (with realtime status)
│   ├── Device discovery section (SmartThings + LG ThinQ)
│   ├── Device cards (power toggle, name, status)
│   └── Admin controls (rename, delete)
├── AC Remote Control (/remote/[deviceId])
│   ├── Large display showing temperature/mode
│   ├── Power button (red)
│   ├── Mode selector (cycle: cool/dry/fan/auto/heat)
│   ├── Temperature controls (+/-)
│   ├── Fan speed controls
│   └── Swing toggle
└── Realtime Engine
    └── Socket.IO client for instant updates
```

### Shared Packages
```
packages/
├── shared-types/
│   ├── Auth DTOs (PinLoginRequestDto, AuthTokensDto)
│   ├── Device DTOs (DeviceDto, CreateDeviceDto, UpdateDeviceNameDto)
│   ├── Command types (ACCommand, TVCommand)
│   └── State types (ACState, TVState)
└── device-contracts/
    └── DeviceProvider interface (for integrations)
```

### Database Schema (Prisma)
```sql
User
  - id (UUID)
  - name (String, for PIN login)
  - email (String, unique)
  - passwordHash (String, legacy)
  - pinHash (String, bcrypt)
  - createdAt/updatedAt

Device
  - id (UUID)
  - name (String)
  - type ('TV' | 'AC')
  - provider ('SMARTTHINGS' | 'LG_THINQ')
  - externalId (String, from provider API)
  - state (JSON)
  - online (Boolean)
  - createdAt/updatedAt

DeviceLog
  - id (UUID)
  - deviceId (FK)
  - action (String)
  - result (String)
  - createdAt
```

## 🔐 Autenticação & Segurança

### Login Flow
1. **User selects name** from dropdown (fetched from `GET /auth/users`)
2. **User enters 4-digit PIN** (0000-9999)
3. API validates PIN with bcrypt compare against `user.pinHash`
4. **JWT tokens issued**: access (15min) + refresh (7 days)
5. Tokens stored in localStorage, included in all API requests

### Password Security
- PINs hashed with **bcrypt (rounds: 12)**
- Passwords also bcrypt'd (for legacy email/password flow)
- JWT secrets: unique, strong secrets required (`openssl rand -hex 32`)

### Admin Authorization
- Admin check on: device rename, device delete operations
- Uses email-based admin list (hardcoded or configurable)
- Respects user roles for UI visibility

## 🔌 Integrations & Device Discovery

### SmartThings (Samsung)
- **Discovery**: `GET /devices/smartthings-available` queries all devices with 'switch' capability
- **Type Inference**: 
  - Has `audioVolume` + `mediaInputSource` → **TV**
  - Has `airConditionerMode` + `fanMode` → **AC**
  - Default: TV
- **Commands**:
  - **TV**: power, volume, mute, input, launchApp
  - **AC**: power, temperature, mode, fanSpeed, swing
- **State Sync**: polling via `refreshDevice(id)` or webhook (not yet implemented)

### LG ThinQ
- **Discovery**: `GET /devices/thinq-available` queries all devices, infers as AC
- **Commands**: power, temperature, mode, fanSpeed, swing
- **State Sync**: polling via `refreshDevice(id)`
- **SDK**: `thinqconnect` official SDK from LG Developer Site

## 🚀 Features Implemented

| Feature | Status | Location |
|---------|--------|----------|
| PIN-based login | ✅ | `auth.service.ts`, `login/page.tsx` |
| Multi-user support | ✅ | `users.service.ts`, auth dropdown |
| Device discovery | ✅ | `devices.service.ts`, dashboard UI |
| Device creation | ✅ | `devices.controller.ts`, dashboard UI |
| Device renaming (admin) | ✅ | `devices.service.ts`, `DeviceCard.tsx` |
| Device deletion (admin) | ✅ | `devices.service.ts`, `DeviceCard.tsx` |
| Device commands | ✅ | `devices.controller.ts`, remote controls |
| AC Remote UI | ✅ | `ACRemoteControl.tsx` |
| Realtime updates | ✅ | `realtime.gateway.ts`, WebSocket |
| Device logs | ✅ | `logs.service.ts` |
| SmartThings integration | ✅ | `smartthings.provider.ts` |
| LG ThinQ integration | ✅ | `lg-thinq.provider.ts` |
| Type inference | ✅ | `smartthings.provider.ts` |

## 📊 Arquitetura

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
