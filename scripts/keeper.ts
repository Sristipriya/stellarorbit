import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

const INTERVAL_SECONDS = 15;
const APY_PERCENT = 1000; 
const IDENTITY = "orbit-deployer";
const NETWORK = "testnet";

const SECONDS_IN_YEAR = 31536000;
const YIELD_MULTIPLIER = (APY_PERCENT / 100) * (INTERVAL_SECONDS / SECONDS_IN_YEAR);

async function getEnvVar(key: string): Promise<string> {
  try {
    const envPath = join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

async function runCommand(cmd: string): Promise<string> {
  const { stdout, stderr } = await execAsync(cmd);
  if (stderr && stderr.toLowerCase().includes("error")) {
    throw new Error(stderr);
  }
  return stdout.trim();
}

async function startKeeper() {
  console.log("=========================================");
  console.log("🤖 ORBIT MULTI-VAULT KEEPER BOT STARTING...");
  console.log("=========================================\n");

  const activeVaults: string[] = [];
  
  const xlmVault = await getEnvVar("VITE_ORBIT_VAULT_CONTRACT_ID");
  const usdcVault = await getEnvVar("VITE_ORBIT_USDC_CONTRACT_ID");
  const indexVault = await getEnvVar("VITE_ORBIT_INDEX_CONTRACT_ID");

  if (xlmVault) activeVaults.push(xlmVault);
  if (usdcVault) activeVaults.push(usdcVault);
  if (indexVault) activeVaults.push(indexVault);

  if (activeVaults.length === 0) {
    console.error("❌ ERROR: No active vaults found in .env.");
    process.exit(1);
  }

  console.log(`🏦 Active Vaults Found: ${activeVaults.length}`);
  activeVaults.forEach(v => console.log(`   - ${v}`));
  console.log(`⏱️  Tick Interval: ${INTERVAL_SECONDS} seconds`);
  console.log(`📈 Simulated APY: ${APY_PERCENT}%\n`);

  let adminAddress: string;
  try {
    adminAddress = await runCommand(`stellar keys address ${IDENTITY}`);
    console.log(`🔑 Admin Address: ${adminAddress}\n`);
  } catch (e) {
    console.error(`❌ ERROR: Could not find stellar keys for '${IDENTITY}'.`);
    process.exit(1);
  }

  console.log("🔄 Starting infinite yield loop across all vaults...\n");

  setInterval(async () => {
    for (const contractId of activeVaults) {
      try {
        const totalAssetsStr = await runCommand(
          `stellar contract invoke --id ${contractId} --network ${NETWORK} --source ${IDENTITY} -- total_assets`,
        );

        const totalAssets = BigInt(totalAssetsStr.replace(/[^0-9]/g, ""));

        if (totalAssets === 0n) {
          console.log(
            `[${new Date().toLocaleTimeString()}] 💤 Vault [${contractId.substring(0, 6)}...] is empty.`,
          );
          continue;
        }

        const exactYieldFloat = Number(totalAssets) * YIELD_MULTIPLIER;
        const yieldStroops = BigInt(Math.floor(exactYieldFloat));

        if (yieldStroops <= 0n) {
          continue;
        }

        const yieldXlm = (Number(yieldStroops) / 10000000).toFixed(7);
        console.log(
          `[${new Date().toLocaleTimeString()}] 🧮 Yield: +${yieldXlm} on [${contractId.substring(0, 6)}...]. Injecting...`,
        );

        await runCommand(
          `stellar contract invoke --id ${contractId} --network ${NETWORK} --source ${IDENTITY} -- harvest --admin ${adminAddress} --yield_amount ${yieldStroops.toString()}`,
        );

        console.log(`[${new Date().toLocaleTimeString()}] ✅ Harvested [${contractId.substring(0, 6)}...]`);
      } catch (err: unknown) {
        console.error(
          `[${new Date().toLocaleTimeString()}] ❌ Keeper Tick Error [${contractId.substring(0, 6)}...]:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
    console.log("---"); // Separator per tick
  }, INTERVAL_SECONDS * 1000);
}

startKeeper();
