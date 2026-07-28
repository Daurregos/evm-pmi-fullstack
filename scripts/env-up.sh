#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm ci
docker compose up -d --wait
npm run db:migrate
npm run db:seed
exec npm run dev
