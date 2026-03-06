#!/bin/sh
set -e

echo "[entrypoint] Checking migration state..."

# If this is the first deploy, mark the baseline migration as already applied
# (the database already has these tables from before Prisma migrations were set up)
if ! npx prisma migrate status 2>&1 | grep -q "applied"; then
  echo "[entrypoint] Baselining existing database — marking 0_init as already applied..."
  npx prisma migrate resolve --applied 0_init 2>/dev/null || true
fi

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting application..."
exec node server.js
