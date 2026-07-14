const { execSync } = require("child_process");
const fs = require("fs");

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

try {
  console.log("1/5 Building contracts...");
  execSync("cargo build --target wasm32v1-none --release", {
    cwd: "contracts/orbit-vault",
    stdio: "inherit",
  });
  execSync("cargo build --target wasm32v1-none --release", {
    cwd: "contracts/orbit-share-token",
    stdio: "inherit",
  });

  const vaultWasm = "contracts/orbit-vault/target/wasm32v1-none/release/orbit_vault.wasm";
  const tokenWasm =
    "contracts/orbit-share-token/target/wasm32v1-none/release/orbit_share_token.wasm";

  console.log("\n2/5 Fetching identifiers...");
  const adminAddress = run("stellar keys address orbit-deployer");
  const xlmSac = run("stellar contract id asset --network testnet --asset native");
  console.log("Admin:", adminAddress);
  console.log("Asset:", xlmSac);

  console.log("\n3/5 Deploying orbit-share-token...");
  const tokenHash = run(
    `stellar contract upload --network testnet --source orbit-deployer --wasm ${tokenWasm}`,
  );

  // orbit-share-token constructor: admin, minter, name, symbol, decimals
  // We use admin as minter initially to satisfy the constructor, then update it later
  const deployTokenCmd = [
    `stellar contract deploy`,
    `--network testnet --source orbit-deployer`,
    `--wasm-hash ${tokenHash}`,
    `--`,
    `--admin ${adminAddress}`,
    `--minter ${adminAddress}`,
    `--name "Orbit XLM Share"`,
    `--symbol "orXLM"`,
    `--decimals 7`,
  ].join(" ");
  const tokenId = run(deployTokenCmd);
  console.log("✅ Share Token Deployed:", tokenId);

  console.log("\n4/5 Deploying orbit-vault...");
  const vaultHash = run(
    `stellar contract upload --network testnet --source orbit-deployer --wasm ${vaultWasm}`,
  );

  // orbit-vault constructor: asset, admin, fee_recipient, perf_fee_bps, share_token
  const deployVaultCmd = [
    `stellar contract deploy`,
    `--network testnet --source orbit-deployer`,
    `--wasm-hash ${vaultHash}`,
    `--`,
    `--asset ${xlmSac}`,
    `--admin ${adminAddress}`,
    `--fee_recipient ${adminAddress}`,
    `--perf_fee_bps 1000`,
    `--share_token ${tokenId}`,
  ].join(" ");
  const vaultId = run(deployVaultCmd);
  console.log("✅ Vault Deployed:", vaultId);

  console.log("\n5/5 Linking token minter to vault...");
  const setMinterCmd = [
    `stellar contract invoke --network testnet --source orbit-deployer`,
    `--id ${tokenId}`,
    `--`,
    `set_minter`,
    `--admin ${adminAddress}`,
    `--new_minter ${vaultId}`,
  ].join(" ");
  run(setMinterCmd);
  console.log("✅ Linked successfully!");

  // Update .env
  let envContent = fs.existsSync(".env") ? fs.readFileSync(".env", "utf-8") : "";
  const updateEnv = (key, val) => {
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${val}`);
    } else {
      envContent += `\n${key}=${val}`;
    }
  };
  updateEnv("VITE_ORBIT_VAULT_CONTRACT_ID", vaultId);
  updateEnv("VITE_ORBIT_SHARE_TOKEN_ID", tokenId);
  fs.writeFileSync(".env", envContent.trim() + "\n");
  console.log("\n✅ Updated .env");

  // Hardcode in network.ts for deployed build fallback
  let networkTs = fs.readFileSync("src/lib/stellar/network.ts", "utf-8");
  networkTs = networkTs.replace(
    /export const ORBIT_VAULT_CONTRACT_ID[^;]+;/,
    `export const ORBIT_VAULT_CONTRACT_ID: string | undefined =\n  "${vaultId}";`,
  );
  fs.writeFileSync("src/lib/stellar/network.ts", networkTs);
  console.log("✅ Updated network.ts");
} catch (err) {
  console.error("Deploy failed:", err.message);
  if (err.stdout) console.log("Stdout:", err.stdout.toString());
  if (err.stderr) console.log("Stderr:", err.stderr.toString());
  process.exit(1);
}
