# 📋 Guia de Variáveis de Ambiente (.env)

## Resumo Rápido
**Sim, você pode usar o `.env` inteiro!** Todas as variáveis são necessárias para rodar o sistema completo.

---

## 🗂️ Variáveis Obrigatórias por Funcionalidade

### 1️⃣ **Banco de Dados (PostgreSQL)** - OBRIGATÓRIO
```env
POSTGRES_USER=casa              # Usuário do banco
POSTGRES_PASSWORD=change-me     # Senha (mudar em produção!)
POSTGRES_DB=casa                # Nome do banco
POSTGRES_PORT=5432              # Porta padrão
DATABASE_URL=postgresql://casa:change-me@localhost:5432/casa?schema=public
```
✅ Necessário para: Device storage, user management, logs  
🔴 Sem isso: API não funciona

---

### 2️⃣ **Redis (Cache/Realtime)** - OBRIGATÓRIO
```env
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
```
✅ Necessário para: WebSocket realtime, device state caching  
🔴 Sem isso: Realtime não funciona

---

### 3️⃣ **API (NestJS)** - OBRIGATÓRIO
```env
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
```
✅ Necessário para: Rodar backend na porta 3001, aceitar requests do frontend  
🔴 Sem isso: Frontend não conecta na API

---

### 4️⃣ **JWT (Autenticação)** - OBRIGATÓRIO
```env
JWT_ACCESS_SECRET=change-me-access-secret        # Token access (15 min)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh-secret      # Token refresh (7 dias)
JWT_REFRESH_EXPIRES_IN=7d
```
✅ Necessário para: Login, autenticação de requests  
🔴 Sem isso: Auth não funciona

**⚠️ IMPORTANTE - Gerar secrets fortes:**
```bash
openssl rand -hex 32
# Gere 2 valores diferentes (um para access, outro para refresh)
```

---

### 5️⃣ **Seed Admin (Usuário Inicial)** - OBRIGATÓRIO
```env
SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-me
SEED_ADMIN_PIN=0000
```
✅ Necessário para: Criar usuário admin na primeira vez  
🚀 Executar: `npm run prisma:seed`  
🔑 Login PIN: 0000

---

### 6️⃣ **SmartThings (Samsung TV/AC)** - OPCIONAL
```env
SMARTTHINGS_PAT=043f5875-b726-439f-af50-d4e41b532f0b
```
✅ Necessário para: Descobrir e controlar TV/AC Samsung  
📍 Gerar em: https://account.smartthings.com/tokens  
❌ Sem isso: Devices Samsung não aparecem

---

### 7️⃣ **LG ThinQ (LG AC)** - OPCIONAL
```env
LG_THINQ_PAT=thinqpat_88d5a28d7fcbda633ae3cf579ed3d07fa4521b45e26c07264e40
LG_THINQ_CLIENT_ID=dc6d3361-2d53-4a20-b6ee-35e8a9915fa7
LG_THINQ_COUNTRY=BR
```
✅ Necessário para: Descobrir e controlar AC LG  
📍 Gerar em: https://smartsolution.developer.lge.com  
❌ Sem isso: Devices LG não aparecem

---

### 8️⃣ **Web (Next.js)** - OBRIGATÓRIO
```env
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001      # Apontado para backend
NEXT_PUBLIC_WS_URL=http://localhost:3001       # WebSocket do backend
```
✅ Necessário para: Frontend conectar na API  
🔴 Sem isso: Frontend não funciona

---

## 🎯 Checklist de Setup

### Desenvolvimento Local (Mínimo)
```bash
✅ PostgreSQL rodando
✅ Redis rodando
✅ Todos os OBRIGATÓRIOS preenchidos
❌ SmartThings (opcional, só se tiver TV Samsung)
❌ LG ThinQ (opcional, só se tiver AC LG)
```

### Produção (Completo)
```bash
✅ Banco de dados em RDS/CloudSQL
✅ Redis em ElastiCache/MemoryStore
✅ JWT secrets fortes (openssl rand -hex 32)
✅ SmartThings PAT válido
✅ LG ThinQ PAT válido
✅ CORS_ORIGIN apontado para domínio real
```

---

## 🔄 Como Carregar o `.env`

### Docker Compose (Recomendado)
```bash
docker-compose up
```
Ele lê automaticamente do `.env`

### Localmente (Node.js)
```bash
npm install dotenv
```
Sua aplicação já usa isso automaticamente.

### Manual
```bash
export $(cat .env | xargs)
npm run dev
```

---

## ⚠️ Segurança

### ❌ NUNCA faça commit do `.env`
```bash
# Verificar se está no .gitignore
cat .gitignore | grep .env
```

### ✅ Use `.env.example` para documentar
```bash
# Copiar para versão de exemplo
cp .env .env.example
# (remover valores sensíveis do .env.example)
```

### 🔐 Em produção:
- Use secrets do provedor de cloud (AWS Secrets Manager, Google Secret Manager)
- Nunca exponha JWT_SECRET ou credenciais de APIs
- Rotacione PATs regularmente

---

## 🚀 Resumo Final

| Variável | Tipo | Necessário | Risco |
|----------|------|-----------|-------|
| `DATABASE_URL` | String | ✅ SIM | 🔴 Alto (expõe db) |
| `REDIS_URL` | String | ✅ SIM | 🟡 Médio |
| `JWT_*_SECRET` | String | ✅ SIM | 🔴 Alto (expõe auth) |
| `SMARTTHINGS_PAT` | String | ❌ Não | 🔴 Alto (expõe token) |
| `LG_THINQ_PAT` | String | ❌ Não | 🔴 Alto (expõe token) |
| `NEXT_PUBLIC_API_URL` | String | ✅ SIM | 🟢 Baixo (é pública) |

**Resposta:** Sim, use o `.env` inteiro, mas guarde-o com segurança! 🔐
