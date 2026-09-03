#!/usr/bin/env bash
# Redeploy after the first install. Run from the repo root on the server:
#   ./deploy.sh
set -euo pipefail

echo "==> Pulling latest"
git pull --ff-only

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Applying database migrations"
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma generate

echo "==> Building (types -> api -> web)"
pnpm build

echo "==> Reloading PM2 processes (zero-downtime)"
pm2 reload ecosystem.config.js

echo "==> Done. Status:"
pm2 status
