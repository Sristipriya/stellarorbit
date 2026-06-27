# Orbit Vault — Soroban contract

Single-asset index vault. Mints shares proportional to asset deposits using
ERC-4626-style share math. Designed so multi-asset RWA support + SEP-40
oracle NAV computation can slot in without rewriting the interface.

## Layout

- `src/lib.rs` — contract.
- `src/test.rs` — unit tests (share math, deposits, withdraws, edge cases).

## Build

Requires Rust (with `wasm32-unknown-unknown`) and the Stellar CLI.

```bash
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli   # if not installed

cd contracts/orbit-vault
cargo test                                          # run unit tests
stellar contract build                              # produces target/wasm32-unknown-unknown/release/orbit_vault.wasm
```

## Deploy to Testnet (one command)

From the repo root:

```bash
scripts/deploy-vault.sh
```

This script builds the WASM, ensures the `orbit-deployer` identity is funded
via Friendbot, uploads + deploys the contract with the native XLM SAC as the
underlying asset, and writes `VITE_ORBIT_VAULT_CONTRACT_ID` into the repo
`.env` so the frontend switches from DEMO to REAL mode on next start.

### Manual deploy (what the script does)

```bash
stellar keys generate --network testnet orbit-deployer
stellar keys fund     --network testnet orbit-deployer

cd contracts/orbit-vault
stellar contract build

WASM_HASH=$(stellar contract upload \
  --network testnet --source orbit-deployer \
  --wasm target/wasm32-unknown-unknown/release/orbit_vault.wasm)

XLM_SAC=$(stellar contract asset id --network testnet --asset native)

CONTRACT_ID=$(stellar contract deploy \
  --network testnet --source orbit-deployer \
  --wasm-hash $WASM_HASH \
  -- --asset $XLM_SAC)

echo "Orbit Vault: $CONTRACT_ID"
```

## Wire into the frontend

Add to `.env` at the repo root:

```bash
VITE_ORBIT_VAULT_CONTRACT_ID=C...
```

`src/lib/stellar/vault.ts` automatically switches to the real Soroban path
when this variable is set.

## L3+ extension hooks

- **Multi-asset accounting**: replace `DataKey::Asset` with a `Vec<AssetSlot>`
  where each slot holds `{ asset: Address, balance: i128, target_bps: u32 }`.
- **Oracle NAV**: introduce a `compute_nav` helper that reads SEP-40 oracle
  prices per asset and returns a single i128 NAV used by `preview_deposit`
  and `preview_redeem`.
- **Rebalancing**: a `rebalance()` admin entry that swaps between assets when
  weights drift past `target_bps`.