#!/bin/sh
set -e

echo "[entrypoint] Checking migration state..."

# On first deploy, the database already has tables but no _prisma_migrations record.
# We must mark the baseline migration as "already applied" BEFORE running migrate deploy.
npx prisma migrate resolve --applied 0_init 2>/dev/null || true

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting application..."
exec node server.js
