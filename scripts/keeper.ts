import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

// Configuration for Hackathon Demo
const INTERVAL_SECONDS = 15;
const APY_PERCENT = 1000; // 1000% APY so changes are visually obvious live
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
  console.log("🤖 ORBIT TRUE DEFI KEEPER BOT STARTING...");
  console.log("=========================================\n");

  const contractId = await getEnvVar("VITE_ORBIT_VAULT_CONTRACT_ID");
  if (!contractId) {
    console.error("❌ ERROR: VITE_ORBIT_VAULT_CONTRACT_ID not found in .env.");
    console.error("Please run `bash scripts/deploy-vault.sh` first to deploy the contract!");
    process.exit(1);
  }

  console.log(`🏦 Vault Contract: ${contractId}`);
  console.log(`⏱️  Tick Interval: ${INTERVAL_SECONDS} seconds`);
  console.log(`📈 Simulated APY: ${APY_PERCENT}%\n`);

  // Get Admin Address
  let adminAddress: string;
  try {
    adminAddress = await runCommand(`stellar keys address ${IDENTITY}`);
    console.log(`🔑 Admin Address: ${adminAddress}\n`);
  } catch (e) {
    console.error(`❌ ERROR: Could not find stellar keys for '${IDENTITY}'.`);
    process.exit(1);
  }

  console.log("🔄 Starting infinite yield loop...\n");

  setInterval(async () => {
    try {
      // 1. Fetch current Total Assets from the contract
      const totalAssetsStr = await runCommand(
        `stellar contract invoke --id ${contractId} --network ${NETWORK} --source ${IDENTITY} -- total_assets`
      );
      
      // Clean the output (stellar-cli might output quotes or extra text)
      const totalAssets = BigInt(totalAssetsStr.replace(/[^0-9]/g, ""));
      
      if (totalAssets === 0n) {
        console.log(`[${new Date().toLocaleTimeString()}] 💤 Vault is empty (0 XLM). Waiting for deposits...`);
        return;
      }

      // 2. Calculate Yield Math
      // yield = totalAssets * (APY) * (time_passed / year)
      const exactYieldFloat = Number(totalAssets) * YIELD_MULTIPLIER;
      const yieldStroops = BigInt(Math.floor(exactYieldFloat));

      if (yieldStroops <= 0n) {
        console.log(`[${new Date().toLocaleTimeString()}] ⏳ Yield too small to harvest this tick.`);
        return;
      }

      const yieldXlm = (Number(yieldStroops) / 10000000).toFixed(7);
      console.log(`[${new Date().toLocaleTimeString()}] 🧮 Calculated Yield: +${yieldXlm} XLM. Injecting into contract...`);

      // 3. Inject Yield via harvest()
      await runCommand(
        `stellar contract invoke --id ${contractId} --network ${NETWORK} --source ${IDENTITY} -- harvest --admin ${adminAddress} --yield_amount ${yieldStroops.toString()}`
      );

      console.log(`[${new Date().toLocaleTimeString()}] ✅ Successfully harvested and compounded!`);

    } catch (err: any) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Keeper Tick Error:`, err.message);
    }
  }, INTERVAL_SECONDS * 1000);
}

startKeeper();
