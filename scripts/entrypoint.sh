#!/bin/sh
set -e

echo "[entrypoint] Syncing database schema..."
npx prisma db push --accept-data-loss --skip-generate

echo "[entrypoint] Starting application..."
exec node server.js
