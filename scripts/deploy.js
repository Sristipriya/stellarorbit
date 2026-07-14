const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("1/4 Building upgraded contract...");
  execSync('cargo build --target wasm32v1-none --release', { 
    cwd: 'contracts/orbit-vault', 
    stdio: 'inherit' 
  });
  const wasmPath = 'contracts/orbit-vault/target/wasm32v1-none/release/orbit_vault.wasm';
  
  console.log("\n2/4 Fetching identifiers...");
  const adminAddress = execSync('stellar keys address orbit-deployer', { encoding: 'utf-8' }).trim();
  const xlmSac = execSync('stellar contract id asset --network testnet --asset native', { encoding: 'utf-8' }).trim();
  console.log("Admin:", adminAddress);
  console.log("Asset:", xlmSac);

  console.log("\n3/4 Uploading WASM...");
  const wasmHash = execSync(
    `stellar contract upload --network testnet --source orbit-deployer --wasm ${wasmPath}`, 
    { encoding: 'utf-8' }
  ).trim();
  console.log("WASM Hash:", wasmHash);
  
  console.log("\n4/4 Deploying contract (fee_recipient = admin, perf_fee_bps = 1000 = 10%)...");
  const deployCmd = [
    `stellar contract deploy`,
    `--network testnet`,
    `--source orbit-deployer`,
    `--wasm-hash ${wasmHash}`,
    `--`,
    `--asset ${xlmSac}`,
    `--admin ${adminAddress}`,
    `--fee_recipient ${adminAddress}`,
    `--perf_fee_bps 1000`
  ].join(' ');
  
  const contractId = execSync(deployCmd, { encoding: 'utf-8' }).trim();
  
  console.log("\n✅ Deployed! New Contract ID:", contractId);
  
  // Update .env
  let envContent = fs.readFileSync('.env', 'utf-8');
  if (envContent.includes('VITE_ORBIT_VAULT_CONTRACT_ID=')) {
    envContent = envContent.replace(/VITE_ORBIT_VAULT_CONTRACT_ID=.*/g, `VITE_ORBIT_VAULT_CONTRACT_ID=${contractId}`);
  } else {
    envContent += `\nVITE_ORBIT_VAULT_CONTRACT_ID=${contractId}`;
  }
  fs.writeFileSync('.env', envContent);
  console.log("✅ Updated .env");
  
  // Also hardcode in network.ts for deployed build
  let networkTs = fs.readFileSync('src/lib/stellar/network.ts', 'utf-8');
  networkTs = networkTs.replace(
    /export const ORBIT_VAULT_CONTRACT_ID[^;]+;/,
    `export const ORBIT_VAULT_CONTRACT_ID: string | undefined =\n  "${contractId}";`
  );
  fs.writeFileSync('src/lib/stellar/network.ts', networkTs);
  console.log("✅ Updated network.ts with new contract ID:", contractId);
  
} catch (err) {
  console.error("Deploy failed:", err.message);
  if (err.stdout) console.log("Stdout:", err.stdout.toString());
  if (err.stderr) console.log("Stderr:", err.stderr.toString());
  process.exit(1);
}
