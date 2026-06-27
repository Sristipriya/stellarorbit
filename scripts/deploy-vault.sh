#!/usr/bin/env bash
# Deploy the Orbit Vault Soroban contract to Stellar Testnet and write
# VITE_ORBIT_VAULT_CONTRACT_ID into the repo .env so the frontend switches
# from DEMO mode to real on-chain mode on next dev/build.
#
# Usage:  scripts/deploy-vault.sh [identity]
#         (identity defaults to "orbit-deployer")
#
# Requirements: rustup target wasm32-unknown-unknown, stellar-cli, jq.
set -euo pipefail

IDENTITY="${1:-orbit-deployer}"
NETWORK="testnet"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$HERE/contracts/orbit-vault"
ENV_FILE="$HERE/.env"

need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ missing dep: $1" >&2; exit 1; }; }
need cargo
need stellar
need jq

echo "→ Building contract WASM"
( cd "$CONTRACT_DIR" && rustup target add wasm32-unknown-unknown >/dev/null && stellar contract build )

WASM="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/orbit_vault.wasm"
[ -f "$WASM" ] || { echo "✗ build output not found: $WASM" >&2; exit 1; }

echo "→ Ensuring identity '$IDENTITY' on $NETWORK"
if ! stellar keys ls 2>/dev/null | grep -q "^$IDENTITY$"; then
  stellar keys generate --network "$NETWORK" "$IDENTITY"
fi
stellar keys fund "$IDENTITY" --network "$NETWORK" >/dev/null || true

echo "→ Resolving native XLM SAC address on $NETWORK"
XLM_SAC="$(stellar contract asset id --network "$NETWORK" --asset native)"
echo "   asset = $XLM_SAC"

echo "→ Uploading WASM"
WASM_HASH="$(stellar contract upload --network "$NETWORK" --source "$IDENTITY" --wasm "$WASM")"
echo "   wasm_hash = $WASM_HASH"

echo "→ Deploying contract instance"
CONTRACT_ID="$(stellar contract deploy \
  --network "$NETWORK" \
  --source "$IDENTITY" \
  --wasm-hash "$WASM_HASH" \
  -- \
  --asset "$XLM_SAC")"

echo
echo "✓ Orbit Vault deployed"
echo "  CONTRACT_ID = $CONTRACT_ID"
echo

# Idempotently write VITE_ORBIT_VAULT_CONTRACT_ID into .env
touch "$ENV_FILE"
if grep -q '^VITE_ORBIT_VAULT_CONTRACT_ID=' "$ENV_FILE"; then
  # cross-platform inline edit
  tmp="$(mktemp)"
  sed "s|^VITE_ORBIT_VAULT_CONTRACT_ID=.*|VITE_ORBIT_VAULT_CONTRACT_ID=$CONTRACT_ID|" "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
else
  echo "VITE_ORBIT_VAULT_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
fi
echo "→ Wrote VITE_ORBIT_VAULT_CONTRACT_ID into $ENV_FILE"
echo "  Restart dev server to pick it up: bun run dev"
