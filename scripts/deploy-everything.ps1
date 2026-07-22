$ErrorActionPreference = "Stop"

$NETWORK = "testnet"
$IDENTITY = "orbit-deployer"
$ADMIN_ADDR = stellar keys address $IDENTITY
$XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
$USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"
$INDEX_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

Write-Host "Re-building everything..."
stellar contract build

Write-Host "Installing WASMs..."
$VAULT_WASM = stellar contract install --network $NETWORK --source $IDENTITY --wasm target/wasm32v1-none/release/orbit_vault.wasm
$TOKEN_WASM = stellar contract install --network $NETWORK --source $IDENTITY --wasm target/wasm32v1-none/release/orbit_share_token.wasm
$TRANCHE_WASM = stellar contract install --network $NETWORK --source $IDENTITY --wasm target/wasm32v1-none/release/orbit_tranche.wasm
$MARKET_WASM = stellar contract install --network $NETWORK --source $IDENTITY --wasm target/wasm32v1-none/release/orbit_market.wasm

function Deploy-VaultStack {
    param (
        [string]$PREFIX,
        [string]$NATIVE_ASSET,
        [string]$VAULT_NAME,
        [string]$SHARE_SYMBOL
    )

    Write-Host "=========================================="
    Write-Host "Deploying Full Stack for $PREFIX Vault..."

    # 1. Share Token
    Write-Host "Deploying Share Token ($SHARE_SYMBOL)..."
    $SHARE_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_WASM -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "$VAULT_NAME Share" --symbol $SHARE_SYMBOL --decimals 7

    # 2. Vault
    Write-Host "Deploying Vault..."
    # admin, fee_recipient, perf_fee_bps, share_token
    $VAULT_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $VAULT_WASM -- --asset $NATIVE_ASSET --admin $ADMIN_ADDR --fee_recipient $ADMIN_ADDR --perf_fee_bps 1000 --share_token $SHARE_TOKEN_ID

    # 3. Update Share Token minter to be the Vault
    Write-Host "Setting Vault as Minter for Share Token..."
    stellar contract invoke --network $NETWORK --source $IDENTITY --id $SHARE_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $VAULT_ID | Out-Null

    # 4. PT Token
    Write-Host "Deploying PT Token..."
    $PT_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_WASM -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "$VAULT_NAME PT" --symbol "PT" --decimals 7

    # 5. YT Token
    Write-Host "Deploying YT Token..."
    $YT_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_WASM -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "$VAULT_NAME YT" --symbol "YT" --decimals 7

    # 6. Tranche
    Write-Host "Deploying Tranche..."
    $TRANCHE_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TRANCHE_WASM -- --vault $VAULT_ID --share_token $SHARE_TOKEN_ID --pt_token $PT_TOKEN_ID --yt_token $YT_TOKEN_ID

    # 7. Update PT/YT minters to be the Tranche
    Write-Host "Setting Tranche as Minter for PT/YT..."
    stellar contract invoke --network $NETWORK --source $IDENTITY --id $PT_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $TRANCHE_ID | Out-Null
    stellar contract invoke --network $NETWORK --source $IDENTITY --id $YT_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $TRANCHE_ID | Out-Null

    # 8. Market
    Write-Host "Deploying Market..."
    $MARKET_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $MARKET_WASM -- --usdc_token $USDC_SAC

    # Return the deployed IDs
    return @{
        PREFIX = $PREFIX
        VAULT = $VAULT_ID
        SHARE = $SHARE_TOKEN_ID
        TRANCHE = $TRANCHE_ID
        PT = $PT_TOKEN_ID
        YT = $YT_TOKEN_ID
        MARKET = $MARKET_ID
    }
}

$results = @()
$results += Deploy-VaultStack -PREFIX "XLM" -NATIVE_ASSET $XLM_SAC -VAULT_NAME "Orbit XLM" -SHARE_SYMBOL "oXLM"
$results += Deploy-VaultStack -PREFIX "USDC" -NATIVE_ASSET $USDC_SAC -VAULT_NAME "Orbit USDC" -SHARE_SYMBOL "oUSDC"
$results += Deploy-VaultStack -PREFIX "INDEX" -NATIVE_ASSET $INDEX_SAC -VAULT_NAME "Orbit Index" -SHARE_SYMBOL "oINDEX"

# Rewrite .env file
$SUPABASE_URL = "https://rzwyivjgsevwwenxsiwd.supabase.co"
$SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6d3lpdmpnc2V2d3dlbnhzaXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjc2MTcsImV4cCI6MjA5OTYwMzYxN30.8mbtSjKqhbP591iYwASn_8K4tkzWMDDyp_7wwAFfi6U"

$envContent = @"
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON
VITE_ADMIN_USER=admin
VITE_ADMIN_PASS=orbit2024
VITE_ORBIT_USDC_TOKEN_ID=$USDC_SAC

"@

foreach ($r in $results) {
    if ($r.PREFIX -eq "XLM") {
        $envContent += "VITE_ORBIT_VAULT_CONTRACT_ID=$($r.VAULT)`n"
        $envContent += "VITE_ORBIT_SHARE_TOKEN_ID=$($r.SHARE)`n"
        $envContent += "VITE_ORBIT_TRANCHE_CONTRACT_ID=$($r.TRANCHE)`n"
        $envContent += "VITE_ORBIT_MARKET_CONTRACT_ID=$($r.MARKET)`n"
        $envContent += "VITE_ORBIT_PT_TOKEN_ID=$($r.PT)`n"
        $envContent += "VITE_ORBIT_YT_TOKEN_ID=$($r.YT)`n`n"
    } else {
        $envContent += "VITE_ORBIT_$($r.PREFIX)_CONTRACT_ID=$($r.VAULT)`n"
        $envContent += "VITE_ORBIT_$($r.PREFIX)_SHARE_TOKEN_ID=$($r.SHARE)`n"
        $envContent += "VITE_ORBIT_$($r.PREFIX)_TRANCHE_ID=$($r.TRANCHE)`n"
        $envContent += "VITE_ORBIT_$($r.PREFIX)_MARKET_ID=$($r.MARKET)`n"
        $envContent += "VITE_ORBIT_$($r.PREFIX)_PT_ID=$($r.PT)`n"
        $envContent += "VITE_ORBIT_$($r.PREFIX)_YT_ID=$($r.YT)`n`n"
    }
}

Set-Content -Path .env -Value $envContent
Write-Host "Deployment complete! .env updated."
