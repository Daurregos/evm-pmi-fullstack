#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose up -d --wait
npm run db:migrate
npm run typecheck
bash scripts/run-executable-tests.sh
