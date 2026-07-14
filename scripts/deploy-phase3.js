const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

try {
  console.log("=========================================");
  console.log("🚀 ORBIT PHASE 3: MULTI-VAULT DEPLOYMENT");
  console.log("=========================================\n");

  const vaultWasm = 'contracts/orbit-vault/target/wasm32v1-none/release/orbit_vault.wasm';
  const tokenWasm = 'contracts/orbit-share-token/target/wasm32v1-none/release/orbit_share_token.wasm';

  if (!fs.existsSync(vaultWasm) || !fs.existsSync(tokenWasm)) {
    console.error("❌ Contracts not built! Please run `bun run scripts/deploy.js` first.");
    process.exit(1);
  }

  const adminAddress = run('stellar keys address orbit-deployer');
  console.log("🔑 Admin:", adminAddress);

  const XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
  const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

  const vaultHash = run(`stellar contract upload --network testnet --source orbit-deployer --wasm ${vaultWasm}`);
  const tokenHash = run(`stellar contract upload --network testnet --source orbit-deployer --wasm ${tokenWasm}`);

  async function deployEcosystem(name, symbol, assetSac, envVarName) {
    console.log(`\n=========================================`);
    console.log(`📦 Deploying ${name} Ecosystem`);
    console.log(`=========================================`);
    
    console.log(`1/3 Deploying ${symbol} Share Token...`);
    const deployTokenCmd = [
      `stellar contract deploy`,
      `--network testnet --source orbit-deployer`,
      `--wasm-hash ${tokenHash}`,
      `--`,
      `--admin ${adminAddress}`,
      `--minter ${adminAddress}`,
      `--name "${name} Share"`,
      `--symbol "${symbol}"`,
      `--decimals 7`
    ].join(' ');
    const tokenId = run(deployTokenCmd);
    console.log(`✅ Token Deployed: ${tokenId}`);

    console.log(`2/3 Deploying Vault Engine...`);
    const deployVaultCmd = [
      `stellar contract deploy`,
      `--network testnet --source orbit-deployer`,
      `--wasm-hash ${vaultHash}`,
      `--`,
      `--asset ${assetSac}`,
      `--admin ${adminAddress}`,
      `--fee_recipient ${adminAddress}`,
      `--perf_fee_bps 1000`,
      `--share_token ${tokenId}`
    ].join(' ');
    const vaultId = run(deployVaultCmd);
    console.log(`✅ Vault Deployed: ${vaultId}`);

    console.log(`3/3 Linking Token Minter...`);
    const setMinterCmd = [
      `stellar contract invoke --network testnet --source orbit-deployer`,
      `--id ${tokenId}`,
      `--`,
      `set_minter`,
      `--admin ${adminAddress}`,
      `--new_minter ${vaultId}`
    ].join(' ');
    run(setMinterCmd);
    console.log("✅ Linked successfully!");

    return { vaultId, tokenId };
  }

  // DEPLOY USDC
  const usdcEnv = deployEcosystem("Orbit USDC", "orUSDC", USDC_SAC, "VITE_ORBIT_USDC_CONTRACT_ID");
  
  // DEPLOY INDEX
  const indexEnv = deployEcosystem("Orbit Yield Index", "orIDX", XLM_SAC, "VITE_ORBIT_INDEX_CONTRACT_ID");

  // UPDATE ENV
  console.log("\n=========================================");
  console.log("📝 Updating configuration...");
  let envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
  const updateEnv = (key, val) => {
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${val}`);
    } else {
      envContent += `\n${key}=${val}`;
    }
  };
  
  updateEnv('VITE_ORBIT_USDC_CONTRACT_ID', usdcEnv.vaultId);
  updateEnv('VITE_ORBIT_USDC_TOKEN_ID', usdcEnv.tokenId);
  updateEnv('VITE_ORBIT_INDEX_CONTRACT_ID', indexEnv.vaultId);
  updateEnv('VITE_ORBIT_INDEX_TOKEN_ID', indexEnv.tokenId);
  
  fs.writeFileSync('.env', envContent.trim() + '\n');
  console.log("✅ Updated .env");

  // UPDATE network.ts fallback
  let networkTs = fs.readFileSync('src/lib/stellar/network.ts', 'utf-8');
  
  // Add USDC fallback if not exists
  if (!networkTs.includes('VITE_ORBIT_USDC_CONTRACT_ID')) {
    networkTs += `\nexport const ORBIT_USDC_CONTRACT_ID: string | undefined =\n  "${usdcEnv.vaultId}";\n`;
  } else {
    networkTs = networkTs.replace(/export const ORBIT_USDC_CONTRACT_ID[^;]+;/, `export const ORBIT_USDC_CONTRACT_ID: string | undefined =\n  "${usdcEnv.vaultId}";`);
  }
  
  // Add INDEX fallback if not exists
  if (!networkTs.includes('VITE_ORBIT_INDEX_CONTRACT_ID')) {
    networkTs += `\nexport const ORBIT_INDEX_CONTRACT_ID: string | undefined =\n  "${indexEnv.vaultId}";\n`;
  } else {
    networkTs = networkTs.replace(/export const ORBIT_INDEX_CONTRACT_ID[^;]+;/, `export const ORBIT_INDEX_CONTRACT_ID: string | undefined =\n  "${indexEnv.vaultId}";`);
  }
  
  fs.writeFileSync('src/lib/stellar/network.ts', networkTs);
  console.log("✅ Updated network.ts");

  console.log("\n🎉 Phase 3 Deployment Complete!");
} catch (err) {
  console.error("Deploy failed:", err.message);
  if (err.stdout) console.log("Stdout:", err.stdout.toString());
  if (err.stderr) console.log("Stderr:", err.stderr.toString());
  process.exit(1);
}
