$ErrorActionPreference = "Stop"

$NETWORK = "testnet"
$IDENTITY = "orbit-deployer"
$ADMIN_ADDR = stellar keys address $IDENTITY

Write-Host "Deploying DeFi Stack for Vaults..."

# Read existing .env variables
$ENV_VARS = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $ENV_VARS[$matches[1]] = $matches[2]
    }
}

function Deploy-DeFi {
    param (
        [string]$PREFIX,
        [string]$VAULT_ID,
        [string]$SHARE_TOKEN_ID,
        [string]$TOKEN_NAME_PREFIX
    )

    Write-Host "=========================================="
    Write-Host "Deploying DeFi for $PREFIX Vault..."
    Write-Host "Vault ID: $VAULT_ID"
    Write-Host "Share Token: $SHARE_TOKEN_ID"

    Write-Host "Installing WASMs..."
    $TOKEN_HASH = stellar contract install --network $NETWORK --source $IDENTITY --wasm target/wasm32v1-none/release/orbit_share_token.wasm
    $TRANCHE_HASH = stellar contract install --network $NETWORK --source $IDENTITY --wasm target/wasm32v1-none/release/orbit_tranche.wasm
    $MARKET_HASH = stellar contract install --network $NETWORK --source $IDENTITY --wasm target/wasm32v1-none/release/orbit_market.wasm

    Write-Host "Deploying PT Token..."
    $PT_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_HASH -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "$TOKEN_NAME_PREFIX PT" --symbol "PT" --decimals 7

    Write-Host "Deploying YT Token..."
    $YT_TOKEN_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TOKEN_HASH -- --admin $ADMIN_ADDR --minter $ADMIN_ADDR --name "$TOKEN_NAME_PREFIX YT" --symbol "YT" --decimals 7

    Write-Host "Deploying Tranche..."
    $TRANCHE_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $TRANCHE_HASH -- --vault $VAULT_ID --share_token $SHARE_TOKEN_ID --pt_token $PT_TOKEN_ID --yt_token $YT_TOKEN_ID

    Write-Host "Updating Minters..."
    stellar contract invoke --network $NETWORK --source $IDENTITY --id $PT_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $TRANCHE_ID | Out-Null
    stellar contract invoke --network $NETWORK --source $IDENTITY --id $YT_TOKEN_ID -- set_minter --admin $ADMIN_ADDR --new_minter $TRANCHE_ID | Out-Null

    Write-Host "Deploying Market..."
    $USDC_TOKEN = $ENV_VARS["VITE_ORBIT_USDC_TOKEN_ID"]
    if (-not $USDC_TOKEN) {
        $USDC_TOKEN = "CDR746VQIV4RI66ULO7B7JWOMSJ3IS745B4NGY3HPME5CCVGCPYVWIK2" # Fallback if not found
    }
    $MARKET_ID = stellar contract deploy --network $NETWORK --source $IDENTITY --wasm-hash $MARKET_HASH -- --usdc_token $USDC_TOKEN

    # Append to .env
    if ($PREFIX -eq "XLM") {
        Add-Content -Path .env -Value "VITE_ORBIT_TRANCHE_CONTRACT_ID=$TRANCHE_ID"
        Add-Content -Path .env -Value "VITE_ORBIT_MARKET_CONTRACT_ID=$MARKET_ID"
        Add-Content -Path .env -Value "VITE_ORBIT_PT_TOKEN_ID=$PT_TOKEN_ID"
        Add-Content -Path .env -Value "VITE_ORBIT_YT_TOKEN_ID=$YT_TOKEN_ID"
    } else {
        Add-Content -Path .env -Value "VITE_ORBIT_$($PREFIX)_TRANCHE_ID=$TRANCHE_ID"
        Add-Content -Path .env -Value "VITE_ORBIT_$($PREFIX)_MARKET_ID=$MARKET_ID"
        Add-Content -Path .env -Value "VITE_ORBIT_$($PREFIX)_PT_ID=$PT_TOKEN_ID"
        Add-Content -Path .env -Value "VITE_ORBIT_$($PREFIX)_YT_ID=$YT_TOKEN_ID"
    }

    Write-Host "Done deploying DeFi for $PREFIX!"
}

# 1. XLM Vault
$XLM_VAULT = $ENV_VARS["VITE_ORBIT_VAULT_CONTRACT_ID"]
$XLM_TOKEN = $ENV_VARS["VITE_ORBIT_SHARE_TOKEN_ID"]
if ($XLM_VAULT -and $XLM_TOKEN) {
    Deploy-DeFi -PREFIX "XLM" -VAULT_ID $XLM_VAULT -SHARE_TOKEN_ID $XLM_TOKEN -TOKEN_NAME_PREFIX "Orbit XLM"
}

# 2. USDC Vault
$USDC_VAULT = $ENV_VARS["VITE_ORBIT_USDC_CONTRACT_ID"]
$USDC_TOKEN = $ENV_VARS["VITE_ORBIT_USDC_TOKEN_ID"]
if ($USDC_VAULT -and $USDC_TOKEN) {
    Deploy-DeFi -PREFIX "USDC" -VAULT_ID $USDC_VAULT -SHARE_TOKEN_ID $USDC_TOKEN -TOKEN_NAME_PREFIX "Orbit USDC"
}

# 3. INDEX Vault
$INDEX_VAULT = $ENV_VARS["VITE_ORBIT_INDEX_CONTRACT_ID"]
$INDEX_TOKEN = $ENV_VARS["VITE_ORBIT_INDEX_TOKEN_ID"]
if ($INDEX_VAULT -and $INDEX_TOKEN) {
    Deploy-DeFi -PREFIX "INDEX" -VAULT_ID $INDEX_VAULT -SHARE_TOKEN_ID $INDEX_TOKEN -TOKEN_NAME_PREFIX "Orbit Index"
}

Write-Host "All DeFi stacks deployed!"
