
$ErrorActionPreference = "Stop"

Write-Host "1. Deploying PT Token..."
$PT_ID = stellar contract deploy --network testnet --source orbit-deployer --wasm target/wasm32v1-none/release/orbit_share_token.wasm -- --admin orbit-deployer --minter orbit-deployer --name "Orbit PT oXLM" --symbol "PT-oXLM" --decimals 7
Write-Host "PT ID: $PT_ID"

Write-Host "2. Deploying YT Token..."
$YT_ID = stellar contract deploy --network testnet --source orbit-deployer --wasm target/wasm32v1-none/release/orbit_share_token.wasm -- --admin orbit-deployer --minter orbit-deployer --name "Orbit YT oXLM" --symbol "YT-oXLM" --decimals 7
Write-Host "YT ID: $YT_ID"

Write-Host "3. Deploying Tranche..."
$VAULT_ID = "CDIKVEXGEHC2FBKP5P7YYZGKFZQUVKN5E4G26NFC7KKU5MLFR27JDIDC"
$SHARE_TOKEN = "CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ"
$TRANCHE_ID = stellar contract deploy --network testnet --source orbit-deployer --wasm target/wasm32v1-none/release/orbit_tranche.wasm -- --vault $VAULT_ID --share_token $SHARE_TOKEN --pt_token $PT_ID --yt_token $YT_ID
Write-Host "TRANCHE ID: $TRANCHE_ID"

Write-Host "4. Updating minters..."
stellar contract invoke --network testnet --source orbit-deployer --id $PT_ID -- set_minter --admin orbit-deployer --new_minter $TRANCHE_ID
stellar contract invoke --network testnet --source orbit-deployer --id $YT_ID -- set_minter --admin orbit-deployer --new_minter $TRANCHE_ID

Write-Host "Done!"

