/**
 * Orbit Vault service.
 *
 * Two code paths share one interface:
 *   - REAL  → VITE_ORBIT_VAULT_CONTRACT_ID set → invokes the deployed
 *             Soroban contract via @stellar/stellar-sdk + wallet-kit signing.
 *   - DEMO  → no contract ID → executes a real Testnet XLM payment-to-self
 *             (0.0000001 XLM, MEMO_TEXT "orbit:<action>:<amount>") so the
 *             user signs and submits a real on-chain Testnet transaction,
 *             and tracks vault shares locally in localStorage. This lets
 *             the dApp ship end-to-end before the Rust contract is deployed.
 *
 * Future (L3+): swap DEMO out, add multi-asset support, and read NAV from
 * SEP-40 oracles inside the contract — see contracts/orbit-vault/README.md.
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
import { NETWORK, HAS_REAL_CONTRACT, ORBIT_VAULT_CONTRACT_ID, xlmToStroops, stroopsToXlm } from "./network";
import { signTx } from "./wallet";

export type VaultState = {
  totalAssetsStroops: bigint; // i128 in stroops
  totalSharesStroops: bigint; // shares share the same scale
  userSharesStroops: bigint;
};

export type ActivityEvent = {
  id: string;
  kind: "deposit" | "withdraw";
  address: string;
  amountStroops: bigint;
  sharesStroops: bigint;
  txHash: string;
  at: number;
};

const LS_STATE = "orbit:vault:state:v1";
const LS_EVENTS = "orbit:vault:events:v1";
const ACTIVITY_EVT = "orbit:activity";

function readState(): { totalAssets: bigint; totalShares: bigint; balances: Record<string, bigint> } {
  if (typeof window === "undefined") return { totalAssets: 0n, totalShares: 0n, balances: {} };
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return { totalAssets: 0n, totalShares: 0n, balances: {} };
    const j = JSON.parse(raw) as { totalAssets: string; totalShares: string; balances: Record<string, string> };
    return {
      totalAssets: BigInt(j.totalAssets),
      totalShares: BigInt(j.totalShares),
      balances: Object.fromEntries(Object.entries(j.balances).map(([k, v]) => [k, BigInt(v)])),
    };
  } catch {
    return { totalAssets: 0n, totalShares: 0n, balances: {} };
  }
}

function writeState(s: { totalAssets: bigint; totalShares: bigint; balances: Record<string, bigint> }) {
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

export function loadEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_EVENTS);
    if (!raw) return [];
    return (JSON.parse(raw) as Array<Omit<ActivityEvent, "amountStroops" | "sharesStroops"> & { amountStroops: string; sharesStroops: string }>).map((e) => ({
      ...e,
      amountStroops: BigInt(e.amountStroops),
      sharesStroops: BigInt(e.sharesStroops),
    }));
  } catch {
    return [];
  }
}

function pushEvent(ev: ActivityEvent) {
  const list = loadEvents();
  list.unshift(ev);
  localStorage.setItem(
    LS_EVENTS,
    JSON.stringify(
      list.slice(0, 50).map((e) => ({
        ...e,
        amountStroops: e.amountStroops.toString(),
        sharesStroops: e.sharesStroops.toString(),
      })),
    ),
  );
  window.dispatchEvent(new CustomEvent(ACTIVITY_EVT, { detail: ev }));
}

export function onActivity(handler: (ev: ActivityEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const cb = (e: Event) => handler((e as CustomEvent<ActivityEvent>).detail);
  window.addEventListener(ACTIVITY_EVT, cb);
  return () => window.removeEventListener(ACTIVITY_EVT, cb);
}

/** ERC-4626-style share math. First deposit: 1 share == 1 asset stroop. */
function previewDeposit(amount: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  if (totalShares === 0n || totalAssets === 0n) return amount;
  return (amount * totalShares) / totalAssets;
}
function previewRedeem(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  if (totalShares === 0n) return 0n;
  return (shares * totalAssets) / totalShares;
}

export function getVaultState(address: string | null): VaultState {
  const s = readState();
  return {
    totalAssetsStroops: s.totalAssets,
    totalSharesStroops: s.totalShares,
    userSharesStroops: address ? s.balances[address] ?? 0n : 0n,
  };
}

export function quoteSharesForDeposit(amountXlm: string, state: VaultState): bigint {
  const amount = xlmToStroops(amountXlm || "0");
  return previewDeposit(amount, state.totalAssetsStroops, state.totalSharesStroops);
}

export function quoteAssetsForShares(sharesXlm: string, state: VaultState): bigint {
  const shares = xlmToStroops(sharesXlm || "0");
  return previewRedeem(shares, state.totalAssetsStroops, state.totalSharesStroops);
}

/**
 * Submit a tiny self-payment on Testnet with an orbit memo and return the tx hash.
 * Used by DEMO mode so deposit/withdraw produce a real on-chain transaction.
 */
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
        amount: "0.0000001", // 1 stroop
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

export async function deposit(address: string, amountXlm: string): Promise<{ txHash: string; sharesMinted: bigint; amountStroops: bigint }> {
  const amountStroops = xlmToStroops(amountXlm);
  if (amountStroops <= 0n) throw new Error("Enter an amount greater than zero.");

  if (HAS_REAL_CONTRACT) {
    // Real Soroban contract path — implemented when ORBIT_VAULT_CONTRACT_ID is set.
    // See contracts/orbit-vault/src/lib.rs `deposit(amount: i128) -> i128`.
    // (Hook left here to keep DEMO and REAL behind one interface.)
    throw new Error(
      `Real-contract path not yet wired in this build. Contract ID ${ORBIT_VAULT_CONTRACT_ID} detected — see src/lib/stellar/vault.ts to enable.`,
    );
  }

  const memo = `orbit:dep:${amountXlm}`;
  const txHash = await submitMarkerTx(address, memo);

  const s = readState();
  const shares = previewDeposit(amountStroops, s.totalAssets, s.totalShares);
  s.totalAssets += amountStroops;
  s.totalShares += shares;
  s.balances[address] = (s.balances[address] ?? 0n) + shares;
  writeState(s);

  const ev: ActivityEvent = {
    id: `${txHash}-d`,
    kind: "deposit",
    address,
    amountStroops,
    sharesStroops: shares,
    txHash,
    at: Date.now(),
  };
  pushEvent(ev);
  return { txHash, sharesMinted: shares, amountStroops };
}

export async function withdraw(address: string, sharesXlm: string): Promise<{ txHash: string; assetsOut: bigint; sharesBurned: bigint }> {
  const sharesStroops = xlmToStroops(sharesXlm);
  if (sharesStroops <= 0n) throw new Error("Enter shares greater than zero.");

  const s = readState();
  const userShares = s.balances[address] ?? 0n;
  if (sharesStroops > userShares) throw new Error("You don't have that many shares.");

  if (HAS_REAL_CONTRACT) {
    throw new Error(
      `Real-contract path not yet wired in this build. Contract ID ${ORBIT_VAULT_CONTRACT_ID} detected — see src/lib/stellar/vault.ts to enable.`,
    );
  }

  const assetsOut = previewRedeem(sharesStroops, s.totalAssets, s.totalShares);
  const memo = `orbit:wd:${stroopsToXlm(sharesStroops, 4)}`;
  const txHash = await submitMarkerTx(address, memo);

  s.totalAssets -= assetsOut;
  s.totalShares -= sharesStroops;
  s.balances[address] = userShares - sharesStroops;
  writeState(s);

  const ev: ActivityEvent = {
    id: `${txHash}-w`,
    kind: "withdraw",
    address,
    amountStroops: assetsOut,
    sharesStroops,
    txHash,
    at: Date.now(),
  };
  pushEvent(ev);
  return { txHash, assetsOut, sharesBurned: sharesStroops };
}