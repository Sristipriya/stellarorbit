const { execSync } = require("child_process");
const fs = require("fs");

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

try {
  console.log("=========================================");
  console.log("🚀 ORBIT PHASE 4: ON-CHAIN ECOSYSTEM DEPLOYMENT");
  console.log("=========================================\n");

  const pointsWasm = "contracts/orbit-points/target/wasm32v1-none/release/orbit_points.wasm";
  const zapWasm = "contracts/orbit-zap-router/target/wasm32v1-none/release/orbit_zap_router.wasm";

  if (!fs.existsSync(pointsWasm) || !fs.existsSync(zapWasm)) {
    console.error("❌ Contracts not built! Please compile first.");
    process.exit(1);
  }

  const adminAddress = run(".\\stellar.exe keys address orbit-deployer");
  console.log("🔑 Admin:", adminAddress);

  console.log("\n1/3 Deploying Orbit Points...");
  const pointsHash = run(
    `.\\stellar.exe contract upload --network testnet --source orbit-deployer --wasm ${pointsWasm}`,
  );
  const deployPointsCmd = [
    `.\\stellar.exe contract deploy`,
    `--network testnet --source orbit-deployer`,
    `--wasm-hash ${pointsHash}`,
  ].join(" ");
  const pointsId = run(deployPointsCmd);
  console.log(`✅ Points Deployed: ${pointsId}`);

  console.log(`\n2/3 Initializing Orbit Points...`);
  run(
    `.\\stellar.exe contract invoke --network testnet --source orbit-deployer --id ${pointsId} -- initialize --admin ${adminAddress}`,
  );
  console.log("✅ Points Initialized!");

  console.log("\n3/3 Deploying Zap Router...");
  const zapHash = run(
    `.\\stellar.exe contract upload --network testnet --source orbit-deployer --wasm ${zapWasm}`,
  );
  const deployZapCmd = [
    `.\\stellar.exe contract deploy`,
    `--network testnet --source orbit-deployer`,
    `--wasm-hash ${zapHash}`,
  ].join(" ");
  const zapId = run(deployZapCmd);
  console.log(`✅ Zap Router Deployed: ${zapId}`);

  console.log(`\n4/4 Authorizing Zap Router on Points Contract...`);
  run(
    `.\\stellar.exe contract invoke --network testnet --source orbit-deployer --id ${pointsId} -- set_authorized --caller ${adminAddress} --router ${zapId} --authorized true`,
  );
  console.log("✅ Zap Router Authorized!");

  console.log("\n=========================================");
  console.log("📝 Updating configuration...");
  let envContent = fs.existsSync(".env") ? fs.readFileSync(".env", "utf-8") : "";
  const updateEnv = (key, val) => {
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${val}`);
    } else {
      envContent += `\n${key}=${val}`;
    }
  };

  updateEnv("VITE_ORBIT_POINTS_CONTRACT_ID", pointsId);
  updateEnv("VITE_ORBIT_ZAP_ROUTER_ID", zapId);
  fs.writeFileSync(".env", envContent.trim() + "\n");
  console.log("✅ Updated .env");

  let networkTs = fs.readFileSync("src/lib/stellar/network.ts", "utf-8");
  if (!networkTs.includes("VITE_ORBIT_POINTS_CONTRACT_ID")) {
    networkTs += `\nexport const ORBIT_POINTS_CONTRACT_ID: string | undefined =\n  "${pointsId}";\n`;
    networkTs += `export const ORBIT_ZAP_ROUTER_ID: string | undefined =\n  "${zapId}";\n`;
  } else {
    networkTs = networkTs.replace(
      /export const ORBIT_POINTS_CONTRACT_ID[^;]+;/,
      `export const ORBIT_POINTS_CONTRACT_ID: string | undefined =\n  "${pointsId}";`,
    );
    networkTs = networkTs.replace(
      /export const ORBIT_ZAP_ROUTER_ID[^;]+;/,
      `export const ORBIT_ZAP_ROUTER_ID: string | undefined =\n  "${zapId}";`,
    );
  }
  fs.writeFileSync("src/lib/stellar/network.ts", networkTs);
  console.log("✅ Updated network.ts");

  console.log("\n🎉 Phase 4 Deployment Complete!");
} catch (err) {
  console.error("Deploy failed:", err.message);
  if (err.stdout) console.log("Stdout:", err.stdout.toString());
  if (err.stderr) console.log("Stderr:", err.stderr.toString());
  process.exit(1);
}
