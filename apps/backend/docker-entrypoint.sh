#!/usr/bin/env sh

# Backend container entrypoint
#
# Responsibilities:
# 1) (Optional) Load runtime secrets from AWS Secrets Manager -> writes /app/.env and /app/packages/database/.env
# 2) (Optional) Run Prisma migrations (deploy-safe)
# 3) Start NestJS backend
#
# Notes:
# - This expects the container to run with an EC2 instance role (or ECS task role) that can read the secret.
# - This script must be idempotent: you can run it repeatedly on deploys.

set -eu

if [ "${RUN_SECRETS_LOADER:-true}" = "true" ]; then
  echo "[entrypoint] Loading secrets from AWS Secrets Manager..."
  node scripts/load-secrets.mjs
else
  echo "[entrypoint] Skipping secrets loader (RUN_SECRETS_LOADER=false)"
fi

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[entrypoint] Running Prisma migrations (migrate deploy)..."

  # Prisma will read DATABASE_URL from /app/packages/database/.env (written by secrets loader).
  # We explicitly set the schema path for safety.
  pnpm exec prisma migrate deploy --schema packages/database/prisma
else
  echo "[entrypoint] Skipping migrations (RUN_MIGRATIONS=false)"
fi

echo "[entrypoint] Starting backend..."
exec node apps/backend/dist/main.js


