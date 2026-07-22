#!/usr/bin/env bash
# Deploy Orbit DeFi Super-Protocol Contracts to Testnet (REAL TOKENS)

set -eu

IDENTITY="${1:-orbit-deployer}"
NETWORK="testnet"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Locating WASMs"
VAULT_WASM="$HERE/contracts/orbit-vault/target/wasm32v1-none/release/orbit_vault.wasm"
TRANCHE_WASM="$HERE/contracts/orbit-tranche/target/wasm32v1-none/release/orbit_tranche.wasm"
MARKET_WASM="$HERE/contracts/orbit-market/target/wasm32v1-none/release/orbit_market.wasm"
TOKEN_WASM="$HERE/contracts/orbit-share-token/target/wasm32v1-none/release/orbit_share_token.wasm"

echo "→ Ensuring identity '$IDENTITY' on $NETWORK"
if ! stellar keys ls 2>/dev/null | grep -q "^$IDENTITY$"; then
  stellar keys generate --network "$NETWORK" "$IDENTITY"
fi
stellar keys fund "$IDENTITY" --network "$NETWORK" >/dev/null || true
ADMIN_ADDR="$(stellar keys address "$IDENTITY")"

echo "→ Uploading WASMs"
VAULT_HASH="$(stellar contract upload --network "$NETWORK" --source "$IDENTITY" --wasm "$VAULT_WASM")"
TRANCHE_HASH="$(stellar contract upload --network "$NETWORK" --source "$IDENTITY" --wasm "$TRANCHE_WASM")"
MARKET_HASH="$(stellar contract upload --network "$NETWORK" --source "$IDENTITY" --wasm "$MARKET_WASM")"
TOKEN_HASH="$(stellar contract upload --network "$NETWORK" --source "$IDENTITY" --wasm "$TOKEN_WASM")"

XLM_SAC="$(stellar contract id asset --network "$NETWORK" --asset native)"

echo "→ Deploying Vault Share Token..."
SHARE_TOKEN_ID="$(stellar contract deploy --network "$NETWORK" --source "$IDENTITY" --wasm-hash "$TOKEN_HASH" -- --admin "$ADMIN_ADDR" --minter "$ADMIN_ADDR" --name "Orbit XLM Vault Share" --symbol "orXLM" --decimals 7)"

echo "→ Deploying Vault..."
VAULT_ID="$(stellar contract deploy --network "$NETWORK" --source "$IDENTITY" --wasm-hash "$VAULT_HASH" -- --asset "$XLM_SAC" --admin "$ADMIN_ADDR" --fee_recipient "$ADMIN_ADDR" --perf_fee_bps 1000 --share_token "$SHARE_TOKEN_ID")"

echo "→ Setting Vault Share Token Minter..."
stellar contract invoke --network "$NETWORK" --source "$IDENTITY" --id "$SHARE_TOKEN_ID" -- set_minter --admin "$ADMIN_ADDR" --new_minter "$VAULT_ID" >/dev/null

echo "→ Deploying PT Token..."
PT_TOKEN_ID="$(stellar contract deploy --network "$NETWORK" --source "$IDENTITY" --wasm-hash "$TOKEN_HASH" -- --admin "$ADMIN_ADDR" --minter "$ADMIN_ADDR" --name "Orbit Principal Token" --symbol "PT" --decimals 7)"

echo "→ Deploying YT Token..."
YT_TOKEN_ID="$(stellar contract deploy --network "$NETWORK" --source "$IDENTITY" --wasm-hash "$TOKEN_HASH" -- --admin "$ADMIN_ADDR" --minter "$ADMIN_ADDR" --name "Orbit Yield Token" --symbol "YT" --decimals 7)"

echo "→ Deploying Test USDC Token..."
USDC_TOKEN_ID="$(stellar contract deploy --network "$NETWORK" --source "$IDENTITY" --wasm-hash "$TOKEN_HASH" -- --admin "$ADMIN_ADDR" --minter "$ADMIN_ADDR" --name "Test USDC" --symbol "USDC" --decimals 7)"

echo "→ Deploying Orbit Tranche..."
TRANCHE_ID="$(stellar contract deploy --network "$NETWORK" --source "$IDENTITY" --wasm-hash "$TRANCHE_HASH" -- --vault "$VAULT_ID" --share_token "$SHARE_TOKEN_ID" --pt_token "$PT_TOKEN_ID" --yt_token "$YT_TOKEN_ID")"

echo "→ Updating PT/YT Minters to Tranche Contract..."
stellar contract invoke --network "$NETWORK" --source "$IDENTITY" --id "$PT_TOKEN_ID" -- set_minter --admin "$ADMIN_ADDR" --new_minter "$TRANCHE_ID" >/dev/null
stellar contract invoke --network "$NETWORK" --source "$IDENTITY" --id "$YT_TOKEN_ID" -- set_minter --admin "$ADMIN_ADDR" --new_minter "$TRANCHE_ID" >/dev/null

echo "→ Deploying Orbit Market..."
MARKET_ID="$(stellar contract deploy --network "$NETWORK" --source "$IDENTITY" --wasm-hash "$MARKET_HASH" -- --usdc_token "$USDC_TOKEN_ID")"

echo "✓ Orbit Full Ecosystem Deployed!"
echo "VAULT_ID=$VAULT_ID"
echo "TRANCHE_ID=$TRANCHE_ID"
echo "MARKET_ID=$MARKET_ID"
echo "PT_TOKEN_ID=$PT_TOKEN_ID"
echo "YT_TOKEN_ID=$YT_TOKEN_ID"
echo "USDC_TOKEN_ID=$USDC_TOKEN_ID"

# Save to .env
cat <<EOF > $HERE/.env
VITE_ORBIT_VAULT_CONTRACT_ID=$VAULT_ID
VITE_ORBIT_TRANCHE_CONTRACT_ID=$TRANCHE_ID
VITE_ORBIT_MARKET_CONTRACT_ID=$MARKET_ID
VITE_ORBIT_PT_TOKEN_ID=$PT_TOKEN_ID
VITE_ORBIT_YT_TOKEN_ID=$YT_TOKEN_ID
VITE_ORBIT_USDC_TOKEN_ID=$USDC_TOKEN_ID
EOF

echo "✓ Wrote contract IDs to .env"
