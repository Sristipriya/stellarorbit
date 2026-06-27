#!/usr/bin/env bash
# One-command setup for a fresh clone of Orbit:
#   1. install JS deps
#   2. test the Soroban contract
#   3. build + deploy it to Stellar Testnet
#   4. write VITE_ORBIT_VAULT_CONTRACT_ID to .env
#
# Usage:  scripts/setup.sh [--skip-deploy]
set -euo pipefail

SKIP_DEPLOY=0
for arg in "$@"; do
  [ "$arg" = "--skip-deploy" ] && SKIP_DEPLOY=1
done

HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"

echo "→ Installing JS deps"
if command -v bun >/dev/null 2>&1; then bun install
elif command -v pnpm >/dev/null 2>&1; then pnpm install
else npm install; fi

echo "→ Running Soroban contract tests"
( cd contracts/orbit-vault && cargo test )

if [ "$SKIP_DEPLOY" -eq 1 ]; then
  echo "✓ Skipping deploy (--skip-deploy). DEMO mode will be used until you set VITE_ORBIT_VAULT_CONTRACT_ID."
  exit 0
fi

echo "→ Deploying contract to Testnet"
bash "$HERE/scripts/deploy-vault.sh"

echo
echo "✓ Setup complete. Start the app with: bun run dev"
