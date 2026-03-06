# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
# O Prisma requer openssl para ler e validar o schema
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# GERA O CLIENT DO PRISMA ANTES DO BUILD
RUN npx prisma generate

# INJETA VARIÁVEL FAKE PARA IMPEDIR QUEBRAS NA PRÉ-RENDERIZAÇÃO DO NEXT.JS
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"

# COMPILA A APLICAÇÃO
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema and scripts for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/entrypoint.sh

# Install Prisma CLI globally or locally to run migrate deploy
RUN npm i prisma@^5.19.1

USER node
EXPOSE 3000
CMD ["./scripts/entrypoint.sh"]