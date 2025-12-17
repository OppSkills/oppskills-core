#!/bin/sh
#
# Backend container entrypoint
#
# Responsibilities:
# - Generate production `.env` files via `load-secrets.mts`
#   - /app/.env (Nest ConfigModule loads this when NODE_ENV=production)
#   - /app/packages/database/.env (Prisma uses this for migrations)
# - Optionally run Prisma migrations (RUN_MIGRATIONS=true)
# - Then exec the passed command (the backend server by default)
#
# Notes:
# - This script is intentionally POSIX sh compatible (Alpine uses BusyBox `sh`).
# - If secrets cannot be loaded, we fail fast to avoid running with missing config.

set -eu

echo "[entrypoint] NODE_ENV=${NODE_ENV:-}"
echo "[entrypoint] AWS_REGION=${AWS_REGION:-}"

# Load secrets unless explicitly running in local mode.
# The load script itself also guards on NODE_ENV.
echo "[entrypoint] Loading secrets..."
pnpm load-secrets

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[entrypoint] Running Prisma migrations (migrate deploy)..."
  # Use the pinned Prisma CLI installed in the image and point it at the schema.
  prisma migrate deploy --schema packages/database/prisma/schema.prisma
else
  echo "[entrypoint] RUN_MIGRATIONS is not true; skipping migrations."
fi

echo "[entrypoint] Starting application: $*"
exec "$@"


