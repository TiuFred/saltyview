# Build de contexto = raiz do monorepo (necessário para acessar packages/*)
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/device-contracts/package.json packages/device-contracts/package.json
RUN npm ci

FROM base AS build
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm run build --workspace=@casa/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
