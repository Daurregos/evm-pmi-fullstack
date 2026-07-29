#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${CI:-}" != "true" ]]; then
  docker compose up -d --wait
fi

npm run db:migrate
rm -rf -- coverage
./node_modules/.bin/c8 bash scripts/run-executable-tests.sh
node --import tsx scripts/check-coverage.ts
