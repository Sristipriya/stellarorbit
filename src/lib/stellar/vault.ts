/**
 * Orbit Vault service.
 *
 * Two code paths share one interface:
 *   - REAL  → VITE_ORBIT_VAULT_CONTRACT_ID set → invokes the deployed
 *             Soroban contract via @stellar/stellar-sdk + wallet-kit signing.
 *   - DEMO  → no contract ID → executes a real Testnet XLM payment-to-self
 *             with a memo so the user signs a real on-chain Testnet tx, and
 *             tracks vault shares locally in localStorage.
 */
import {
  Asset,
  Horizon,
  Memo,
  Networks as SdkNetworks,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { NETWORK, HAS_REAL_CONTRACT, xlmToStroops, stroopsToXlm, STROOPS_PER_XLM } from "./network";
import { signTx } from "./wallet";
import { addrArg, i128Arg, invokeContract, readContract } from "./soroban";

export type VaultState = {
  totalAssetsStroops: bigint;
  totalSharesStroops: bigint;
  userSharesStroops: bigint;
  /** Price per share in assets, scaled by 1e7 (so 1.0 == STROOPS_PER_XLM). */
  pricePerShareScaled: bigint;
  /** 7-day annualised APY in basis points. 500 = 5% APY. 0 if not enough history. */
  apyBps: bigint;
};

export type PriceSnapshot = {
  timestamp: number; // Unix seconds
  priceScaled: bigint; // price per share × 1e7
};

export const ZERO_STATE: VaultState = {
  totalAssetsStroops: 0n,
  totalSharesStroops: 0n,
  userSharesStroops: 0n,
  pricePerShareScaled: STROOPS_PER_XLM,
  apyBps: 0n,
};

/* ───────────────────────── Local demo-mode ledger ─────────────────────── */

const LS_STATE = "orbit:vault:state:v1";
const LS_HISTORY = "orbit:vault:history:v1";

type DemoState = { totalAssets: bigint; totalShares: bigint; balances: Record<string, bigint> };

function readDemoState(): DemoState {
  if (typeof window === "undefined") return { totalAssets: 0n, totalShares: 0n, balances: {} };
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return { totalAssets: 0n, totalShares: 0n, balances: {} };
    const j = JSON.parse(raw) as {
      totalAssets: string;
      totalShares: string;
      balances: Record<string, string>;
    };
    return {
      totalAssets: BigInt(j.totalAssets),
      totalShares: BigInt(j.totalShares),
      balances: Object.fromEntries(Object.entries(j.balances).map(([k, v]) => [k, BigInt(v)])),
    };
  } catch {
    return { totalAssets: 0n, totalShares: 0n, balances: {} };
  }
}

function writeDemoState(s: DemoState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    LS_STATE,
    JSON.stringify({
      totalAssets: s.totalAssets.toString(),
      totalShares: s.totalShares.toString(),
      balances: Object.fromEntries(Object.entries(s.balances).map(([k, v]) => [k, v.toString()])),
    }),
  );
}

function appendDemoHistory(priceScaled: bigint) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    const arr: { timestamp: number; priceScaled: string }[] = raw ? JSON.parse(raw) : [];
    arr.push({ timestamp: Math.floor(Date.now() / 1000), priceScaled: priceScaled.toString() });
    // Keep last 90 entries
    const trimmed = arr.slice(-90);
    localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed));
  } catch {
    /* noop */
  }
}

function readDemoHistory(): PriceSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    const arr: { timestamp: number; priceScaled: string }[] = JSON.parse(raw);
    return arr.map((e) => ({ timestamp: e.timestamp, priceScaled: BigInt(e.priceScaled) }));
  } catch {
    return [];
  }
}

function priceScaled(totalAssets: bigint, totalShares: bigint): bigint {
  if (totalShares === 0n) return STROOPS_PER_XLM;
  return (totalAssets * STROOPS_PER_XLM) / totalShares;
}

/** Calculate 7-day APY in basis points from a price snapshot history. */
function calcApyBps(history: PriceSnapshot[]): bigint {
  if (history.length < 2) return 0n;
  const latest = history[history.length - 1];
  const sevenDaysSecs = 7 * 24 * 3600;
  const targetTs = latest.timestamp - sevenDaysSecs;
  let baseline = history[0];
  for (const snap of history) {
    if (snap.timestamp < targetTs) baseline = snap;
    else break;
  }
  const elapsed = latest.timestamp - baseline.timestamp;
  if (elapsed < 3600 || baseline.priceScaled === 0n) return 0n;
  const secondsInYear = 365n * 24n * 3600n;
  const elapsedBig = BigInt(elapsed);
  const ratioScaled = (latest.priceScaled * 1_000_000n) / baseline.priceScaled;
  const growthScaled = ratioScaled - 1_000_000n;
  return (growthScaled * secondsInYear * 10_000n) / (elapsedBig * 1_000_000n);
}

/** Off-chain preview math used for both modes to compute UI quotes. */
function previewDeposit(amount: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  if (totalShares === 0n || totalAssets === 0n) return amount;
  return (amount * totalShares) / totalAssets;
}
function previewRedeem(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  if (totalShares === 0n) return 0n;
  return (shares * totalAssets) / totalShares;
}

export function quoteSharesForDeposit(amountXlm: string, state: VaultState): bigint {
  return previewDeposit(
    xlmToStroops(amountXlm || "0"),
    state.totalAssetsStroops,
    state.totalSharesStroops,
  );
}
export function quoteAssetsForShares(sharesXlm: string, state: VaultState): bigint {
  return previewRedeem(
    xlmToStroops(sharesXlm || "0"),
    state.totalAssetsStroops,
    state.totalSharesStroops,
  );
}

/* ───────────────────────────── Read state ─────────────────────────────── */

export async function getVaultState(address: string | null): Promise<VaultState> {
  if (HAS_REAL_CONTRACT) {
    const [totalAssets, totalShares, userShares, apyBps, history] = await Promise.all([
      readContract<bigint>("total_assets").catch(() => 0n),
      readContract<bigint>("total_shares").catch(() => 0n),
      address
        ? readContract<bigint>("balance_of", [addrArg(address)]).catch(() => 0n)
        : Promise.resolve(0n),
      readContract<bigint>("get_apy_bps").catch(() => 0n),
      readContract<Array<{ timestamp: bigint; price_scaled: bigint }>>("get_price_history").catch(
        () => [],
      ),
    ]);
    return {
      totalAssetsStroops: BigInt(totalAssets),
      totalSharesStroops: BigInt(totalShares),
      userSharesStroops: BigInt(userShares),
      pricePerShareScaled: priceScaled(BigInt(totalAssets), BigInt(totalShares)),
      apyBps: BigInt(apyBps),
    };
  }
  const s = readDemoState();
  const demoHistory = readDemoHistory();
  return {
    totalAssetsStroops: s.totalAssets,
    totalSharesStroops: s.totalShares,
    userSharesStroops: address ? (s.balances[address] ?? 0n) : 0n,
    pricePerShareScaled: priceScaled(s.totalAssets, s.totalShares),
    apyBps: calcApyBps(demoHistory),
  };
}

/** Fetch on-chain price history for the chart. */
export async function getPriceHistory(): Promise<PriceSnapshot[]> {
  if (HAS_REAL_CONTRACT) {
    try {
      const raw =
        await readContract<Array<{ timestamp: bigint | number; price_scaled: bigint | number }>>(
          "get_price_history",
        );
      if (!Array.isArray(raw)) return [];
      return raw.map((e) => ({
        timestamp: Number(e.timestamp),
        priceScaled: BigInt(e.price_scaled),
      }));
    } catch {
      return [];
    }
  }
  return readDemoHistory();
}

/* ─────────────────────── Demo-mode marker payment ─────────────────────── */

async function submitMarkerTx(address: string, memoText: string): Promise<string> {
  const horizon = new Horizon.Server(NETWORK.horizonUrl);
  const account = await horizon.loadAccount(address);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: SdkNetworks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: address,
        asset: Asset.native(),
        amount: "0.0000001",
      }),
    )
    .addMemo(Memo.text(memoText.slice(0, 28)))
    .setTimeout(60)
    .build();

  const { signedTxXdr } = await signTx(tx.toXDR(), SdkNetworks.TESTNET, address);
  const signed = TransactionBuilder.fromXDR(signedTxXdr, SdkNetworks.TESTNET);
  const res = await horizon.submitTransaction(signed);
  return res.hash;
}

/* ───────────────────────────── Deposit ────────────────────────────────── */

export async function deposit(
  address: string,
  amountXlm: string,
): Promise<{ txHash: string; sharesMinted: bigint; amountStroops: bigint }> {
  const amountStroops = xlmToStroops(amountXlm);
  if (amountStroops <= 0n) throw new Error("Enter an amount greater than zero.");

  if (HAS_REAL_CONTRACT) {
    const { txHash, retval } = await invokeContract<bigint>(address, "deposit", [
      addrArg(address),
      i128Arg(amountStroops),
    ]);
    const sharesMinted = retval == null ? 0n : BigInt(retval);
    return { txHash, sharesMinted, amountStroops };
  }

  const memo = `orbit:dep:${amountXlm}`;
  const txHash = await submitMarkerTx(address, memo);
  const s = readDemoState();
  const shares = previewDeposit(amountStroops, s.totalAssets, s.totalShares);
  s.totalAssets += amountStroops;
  s.totalShares += shares;
  s.balances[address] = (s.balances[address] ?? 0n) + shares;
  writeDemoState(s);
  // Record price snapshot in demo mode
  appendDemoHistory(priceScaled(s.totalAssets, s.totalShares));
  return { txHash, sharesMinted: shares, amountStroops };
}

/* ───────────────────────────── Withdraw ───────────────────────────────── */

export async function withdraw(
  address: string,
  sharesXlm: string,
): Promise<{ txHash: string; assetsOut: bigint; sharesBurned: bigint }> {
  const sharesStroops = xlmToStroops(sharesXlm);
  if (sharesStroops <= 0n) throw new Error("Enter shares greater than zero.");

  if (HAS_REAL_CONTRACT) {
    const { txHash, retval } = await invokeContract<bigint>(address, "withdraw", [
      addrArg(address),
      i128Arg(sharesStroops),
    ]);
    const assetsOut = retval == null ? 0n : BigInt(retval);
    return { txHash, assetsOut, sharesBurned: sharesStroops };
  }

  const s = readDemoState();
  const userShares = s.balances[address] ?? 0n;
  if (sharesStroops > userShares) throw new Error("You don't have that many shares.");
  const assetsOut = previewRedeem(sharesStroops, s.totalAssets, s.totalShares);
  const memo = `orbit:wd:${stroopsToXlm(sharesStroops, 4)}`;
  const txHash = await submitMarkerTx(address, memo);
  s.totalAssets -= assetsOut;
  s.totalShares -= sharesStroops;
  s.balances[address] = userShares - sharesStroops;
  writeDemoState(s);
  appendDemoHistory(priceScaled(s.totalAssets, s.totalShares));
  return { txHash, assetsOut, sharesBurned: sharesStroops };
}

/* ─────────────────────────── Yield (Admin) ─────────────────────────────── */

export async function harvest(
  adminAddress: string,
  yieldAmountXlm: string,
): Promise<{ txHash: string; yieldAmountStroops: bigint }> {
  const yieldAmountStroops = xlmToStroops(yieldAmountXlm);
  if (yieldAmountStroops <= 0n) throw new Error("Enter an amount greater than zero.");

  if (HAS_REAL_CONTRACT) {
    const { txHash } = await invokeContract<bigint>(adminAddress, "harvest", [
      addrArg(adminAddress),
      i128Arg(yieldAmountStroops),
    ]);
    return { txHash, yieldAmountStroops };
  }

  // Demo mode
  const memo = `orbit:hrv:${stroopsToXlm(yieldAmountStroops, 4)}`;
  const txHash = await submitMarkerTx(adminAddress, memo);
  const s = readDemoState();
  // Apply 10% performance fee in demo mode too
  const fee = yieldAmountStroops / 10n;
  const net = yieldAmountStroops - fee;
  s.totalAssets += net;
  writeDemoState(s);
  appendDemoHistory(priceScaled(s.totalAssets, s.totalShares));
  return { txHash, yieldAmountStroops };
}

/* ─────────────── P&L Tracking (localStorage-based, per wallet) ──────────── */

const LS_POSITIONS = "orbit:positions:v1";

type PositionRecord = {
  walletAddress: string;
  entrySharePrice: string; // scaled string (bigint)
  entryTimestamp: number;
  initialSharesMinted: string;
};

function readPositions(): PositionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_POSITIONS);
    return raw ? (JSON.parse(raw) as PositionRecord[]) : [];
  } catch {
    return [];
  }
}

function writePositions(positions: PositionRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_POSITIONS, JSON.stringify(positions));
}

/** Record a new deposit position for P&L tracking. */
export function recordPosition(
  walletAddress: string,
  entrySharePriceScaled: bigint,
  sharesMinted: bigint,
) {
  const positions = readPositions();
  positions.push({
    walletAddress,
    entrySharePrice: entrySharePriceScaled.toString(),
    entryTimestamp: Math.floor(Date.now() / 1000),
    initialSharesMinted: sharesMinted.toString(),
  });
  writePositions(positions);
}

export type PnlResult = {
  entryPriceScaled: bigint;
  currentPriceScaled: bigint;
  entryTimestamp: number;
  totalSharesDeposited: bigint; // sum across all deposit events
  currentValueStroops: bigint;
  earnedStroops: bigint;
  earnedPct: number;
};

/** Compute P&L for a wallet from recorded positions and current vault state. */
export function computePnl(walletAddress: string, state: VaultState): PnlResult | null {
  const positions = readPositions().filter((p) => p.walletAddress === walletAddress);
  if (positions.length === 0) return null;

  const totalShares = positions.reduce((acc, p) => acc + BigInt(p.initialSharesMinted), 0n);
  const oldestEntry = positions.reduce((a, b) => (a.entryTimestamp < b.entryTimestamp ? a : b));
  const entryPriceScaled = BigInt(oldestEntry.entrySharePrice);
  const currentPriceScaled = state.pricePerShareScaled;

  // Cost basis: total_shares × entry_price
  const costBasisStroops = (totalShares * entryPriceScaled) / STROOPS_PER_XLM;

  // Current value: user_shares_in_vault × current_price
  const currentShares = state.userSharesStroops;
  const currentValueStroops = (currentShares * currentPriceScaled) / STROOPS_PER_XLM;
  const earnedStroops = currentValueStroops - costBasisStroops;
  const earnedPct =
    costBasisStroops > 0n ? Number((earnedStroops * 10000n) / costBasisStroops) / 100 : 0;

  return {
    entryPriceScaled,
    currentPriceScaled,
    entryTimestamp: oldestEntry.entryTimestamp,
    totalSharesDeposited: totalShares,
    currentValueStroops,
    earnedStroops,
    earnedPct,
  };
}
