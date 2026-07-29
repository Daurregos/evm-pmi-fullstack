#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm run test:coverage-policy
npm run test:structure
npm run test:client
npm run test:integration
npm run test:contract
