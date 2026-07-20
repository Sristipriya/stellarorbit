#!/usr/bin/env bash
# Deploy Orbit DeFi Super-Protocol Contracts to Testnet

set -eu

IDENTITY="${1:-orbit-deployer}"
NETWORK="testnet"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Building Tranche Contract"
cd "$HERE/contracts/orbit-tranche"
cargo build --target wasm32v1-none --release
TRANCHE_WASM="$HERE/contracts/orbit-tranche/target/wasm32v1-none/release/orbit_tranche.wasm"

echo "→ Building Market Contract"
cd "$HERE/contracts/orbit-market"
cargo build --target wasm32v1-none --release
MARKET_WASM="$HERE/contracts/orbit-market/target/wasm32v1-none/release/orbit_market.wasm"

echo "✓ Contracts compiled to WASM"
echo "To deploy, we will need to:"
echo "1. Deploy orbit-share-token twice (for PT and YT)"
echo "2. Deploy orbit-tranche with vault_id, share_token, pt_token, yt_token"
echo "3. Deploy orbit-market with usdc_token"
echo "Deployment logic to follow in next iteration."
