$ErrorActionPreference = "Stop"

$IDENTITY = "orbit-deployer"
$NETWORK = "testnet"

Write-Host "→ Locating WASMs"
$VAULT_WASM = ".\target\wasm32v1-none\release\orbit_vault.wasm"
$TRANCHE_WASM = ".\target\wasm32v1-none\release\orbit_tranche.wasm"
$MARKET_WASM = ".\target\wasm32v1-none\release\orbit_market.wasm"
$TOKEN_WASM = ".\target\wasm32v1-none\release\orbit_share_token.wasm"

Write-Host "→ Ensuring identity '$IDENTITY' on $NETWORK"
try {
    $keys = stellar keys ls 2>&1
    if ($keys -notmatch "^$IDENTITY$") {
        stellar keys generate --network $NETWORK $IDENTITY
    }
} catch {
    stellar keys generate --network $NETWORK $IDENTITY
}
stellar keys fund $IDENTITY --network $NETWORK | Out-Null
$ADMIN_ADDR = stellar keys address $IDENTITY

Write-Host "→ Uploading WASMs"
$VAULT_HASH = stellar contract upload --network $NETWORK --source $IDENTITY --wasm $VAULT_WASM
$TRANCHE_HASH = stellar contract upload --network $NETWORK --source $IDENTITY --wasm $TRANCHE_WASM
$MARKET_HASH = stellar contract upload --network $NETWORK --source $IDENTITY --wasm $MARKET_WASM
$TOKEN_HASH = stellar contract upload --network $NETWORK --source $IDENTITY --wasm $TOKEN_WASM

$XLM_SAC = stellar contract id asset --network $NETWORK --asset native

Write-Host "→ Deploying Vault Share Token..."
$SHARE_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_HASH -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "Orbit XLM Vault Share" --symbol "orXLM" --decimals 7

Write-Host "→ Deploying Vault..."
$VAULT_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $VAULT_HASH -- --asset $XLM_SAC --admin $ADMIN_ADDR --fee_recipient $ADMIN_ADDR --perf_fee_bps 1000 --share_token $SHARE_TOKEN_ID

Write-Host "→ Setting Vault Share Token Minter..."
stellar contract invoke --network $NETWORK --source $IDENTITY --id $SHARE_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $VAULT_ID | Out-Null

Write-Host "→ Deploying PT Token..."
$PT_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_HASH -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "Orbit Principal Token" --symbol "PT" --decimals 7

Write-Host "→ Deploying YT Token..."
$YT_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_HASH -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "Orbit Yield Token" --symbol "YT" --decimals 7

Write-Host "→ Deploying Test USDC Token..."
$USDC_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_HASH -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "Test USDC" --symbol "USDC" --decimals 7

Write-Host "→ Deploying Orbit Tranche..."
$TRANCHE_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TRANCHE_HASH -- --vault $VAULT_ID --share_token $SHARE_TOKEN_ID --pt_token $PT_TOKEN_ID --yt_token $YT_TOKEN_ID

Write-Host "→ Updating PT/YT Minters to Tranche Contract..."
stellar contract invoke --network $NETWORK --source $IDENTITY --id $PT_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $TRANCHE_ID | Out-Null
stellar contract invoke --network $NETWORK --source $IDENTITY --id $YT_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $TRANCHE_ID | Out-Null

Write-Host "→ Deploying Orbit Market..."
$MARKET_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $MARKET_HASH -- --usdc_token $USDC_TOKEN_ID

Write-Host "✓ Orbit Full Ecosystem Deployed!"
Write-Host "VAULT_ID=$VAULT_ID"
Write-Host "TRANCHE_ID=$TRANCHE_ID"
Write-Host "MARKET_ID=$MARKET_ID"
Write-Host "PT_TOKEN_ID=$PT_TOKEN_ID"
Write-Host "YT_TOKEN_ID=$YT_TOKEN_ID"
Write-Host "USDC_TOKEN_ID=$USDC_TOKEN_ID"


"VITE_ORBIT_VAULT_CONTRACT_ID=$VAULT_ID" > .env
"VITE_ORBIT_TRANCHE_CONTRACT_ID=$TRANCHE_ID" >> .env
"VITE_ORBIT_MARKET_CONTRACT_ID=$MARKET_ID" >> .env
"VITE_ORBIT_PT_TOKEN_ID=$PT_TOKEN_ID" >> .env
"VITE_ORBIT_YT_TOKEN_ID=$YT_TOKEN_ID" >> .env
"VITE_ORBIT_USDC_TOKEN_ID=$USDC_TOKEN_ID" >> .env

Write-Host "✓ Wrote contract IDs to .env"
