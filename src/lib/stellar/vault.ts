/**
 * Orbit Vault service.
 *
 * Two code paths share one interface:
 *   - REAL  → VITE_ORBIT_VAULT_CONTRACT_ID set → invokes the deployed
 *             Soroban contract via @stellar/stellar-sdk + wallet-kit signing.
 *             All state (total_assets, total_shares, balance_of) is fetched
 *             from the contract; activity events come from Soroban RPC.
 *   - DEMO  → no contract ID → executes a real Testnet XLM payment-to-self
 *             with a memo so the user signs a real on-chain Testnet tx, and
 *             tracks vault shares locally in localStorage. Activity comes
 *             from Horizon by reading memo-tagged transactions.
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
};

export const ZERO_STATE: VaultState = {
  totalAssetsStroops: 0n,
  totalSharesStroops: 0n,
  userSharesStroops: 0n,
  pricePerShareScaled: STROOPS_PER_XLM,
};

/* ───────────────────────── Local demo-mode ledger ─────────────────────── */

const LS_STATE = "orbit:vault:state:v1";

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

function priceScaled(totalAssets: bigint, totalShares: bigint): bigint {
  if (totalShares === 0n) return STROOPS_PER_XLM;
  return (totalAssets * STROOPS_PER_XLM) / totalShares;
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
    // Fan out contract reads in parallel.
    const [totalAssets, totalShares, userShares] = await Promise.all([
      readContract<bigint>("total_assets").catch(() => 0n),
      readContract<bigint>("total_shares").catch(() => 0n),
      address
        ? readContract<bigint>("balance_of", [addrArg(address)]).catch(() => 0n)
        : Promise.resolve(0n),
    ]);
    return {
      totalAssetsStroops: BigInt(totalAssets),
      totalSharesStroops: BigInt(totalShares),
      userSharesStroops: BigInt(userShares),
      pricePerShareScaled: priceScaled(BigInt(totalAssets), BigInt(totalShares)),
    };
  }
  const s = readDemoState();
  return {
    totalAssetsStroops: s.totalAssets,
    totalSharesStroops: s.totalShares,
    userSharesStroops: address ? (s.balances[address] ?? 0n) : 0n,
    pricePerShareScaled: priceScaled(s.totalAssets, s.totalShares),
  };
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
  return { txHash, assetsOut, sharesBurned: sharesStroops };
}
