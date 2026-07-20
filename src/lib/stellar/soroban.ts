/**
 * Soroban RPC helpers for Orbit.
 *
 * Wraps the @stellar/stellar-sdk v16 `rpc.Server` so the rest of the app can
 * just call `readContract("total_assets")` or
 * `invokeContract(user, "deposit", [addr, i128])`. Used only when
 * VITE_ORBIT_VAULT_CONTRACT_ID is set.
 */
import {
  Account,
  Address as SdkAddress,
  BASE_FEE,
  Contract,
  Networks as SdkNetworks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { NETWORK, ORBIT_VAULT_CONTRACT_ID } from "./network";
import { signTx } from "./wallet";

function requireContract(): string {
  if (!ORBIT_VAULT_CONTRACT_ID) throw new Error("VITE_ORBIT_VAULT_CONTRACT_ID is not set");
  return ORBIT_VAULT_CONTRACT_ID;
}

let _server: rpc.Server | null = null;
export function rpcServer(): rpc.Server {
  if (!_server) _server = new rpc.Server(NETWORK.sorobanRpcUrl, { allowHttp: false });
  return _server;
}

/**
 * Throwaway source for read-only `simulateTransaction` calls.
 *
 * Keep this deterministic: `Keypair.random()` pulls Node-style Buffer/crypto
 * paths into the browser bundle during module evaluation and crashes the
 * published `/app` route before React can render.
 */
const READ_SOURCE_PK = "GAWGGVQZTAY77QSRUE74U4PNXTQ5J4PKWBQ2UNMONQFL32TODVK6ECWJ";

export type ScArg = xdr.ScVal;

export function addrArg(g: string): ScArg {
  return SdkAddress.fromString(g).toScVal();
}
export function voidArg(): ScArg {
  return xdr.ScVal.scvVoid();
}
export function i128Arg(v: bigint | string | number): ScArg {
  return nativeToScVal(typeof v === "bigint" ? v : BigInt(v), { type: "i128" });
}

/** Read-only contract call. */
export async function readContract<T = unknown>(
  method: string,
  args: ScArg[] = [],
  contractId?: string,
): Promise<T> {
  const targetId = contractId || requireContract();
  const contract = new Contract(targetId);
  const src = new Account(READ_SOURCE_PK, "0");
  const tx = new TransactionBuilder(src, {
    fee: BASE_FEE,
    networkPassphrase: SdkNetworks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpcServer().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(`simulate(${method}): ${sim.error}`);
  if (!("result" in sim) || !sim.result) throw new Error(`simulate(${method}): no result`);
  return scValToNative(sim.result.retval) as T;
}

/** Write contract call: simulates + prepares + signs + submits + polls. */
export async function invokeContract<T = unknown>(
  source: string,
  method: string,
  args: ScArg[],
  contractId?: string,
): Promise<{ txHash: string; retval: T | null }> {
  const server = rpcServer();
  const targetId = contractId || requireContract();
  const contract = new Contract(targetId);

  const account = await server.getAccount(source);
  const raw = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: SdkNetworks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(120)
    .build();

  // prepareTransaction simulates + assembles required Soroban auth + footprint + resource fees.
  const prepared = await server.prepareTransaction(raw);

  const { signedTxXdr } = await signTx(prepared.toXDR(), SdkNetworks.TESTNET, source);
  const signed = TransactionBuilder.fromXDR(signedTxXdr, SdkNetworks.TESTNET);

  const send = await server.sendTransaction(signed);
  if (send.status === "ERROR") {
    throw new Error(
      `sendTransaction failed: ${JSON.stringify(send.errorResult?.result() ?? send)}`,
    );
  }
  const hash = send.hash;

  // Poll up to ~60s.
  let res: rpc.Api.GetTransactionResponse | null = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const r = await server.getTransaction(hash);
    if (r.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
      res = r;
      break;
    }
  }
  if (!res) throw new Error(`Transaction ${hash} not confirmed within timeout`);
  if (res.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction ${hash} failed: ${res.status}`);
  }
  const retval = (res as rpc.Api.GetSuccessfulTransactionResponse).returnValue
    ? (scValToNative((res as rpc.Api.GetSuccessfulTransactionResponse).returnValue!) as T)
    : null;
  return { txHash: hash, retval };
}

/** Latest ledger sequence (used to bound `getEvents` start). */
export async function latestLedger(): Promise<number> {
  const r = await rpcServer().getLatestLedger();
  return r.sequence;
}

export type ContractEvent = {
  id: string; // unique paging id from RPC
  ledger: number;
  txHash: string;
  topic0: string; // symbol name, "Dep" | "Wd" | other
  values: unknown[]; // decoded values (for Orbit: [from, amount, shares])
};

/** Fetch Orbit contract events from `startLedger` to head. */
export async function fetchContractEvents(startLedger: number, contractId: string): Promise<ContractEvent[]> {
  const server = rpcServer();
  const res = await server.getEvents({
    startLedger,
    filters: [{ type: "contract", contractIds: [contractId], topics: [["*"]] }],
    limit: 10000,
  });
  return res.events.map((e) => {
    const topics = e.topic.map((t) => {
      try {
        return scValToNative(t) as unknown;
      } catch {
        return null;
      }
    });
    let parsedVal: unknown = null;
    try {
      parsedVal = scValToNative(e.value);
    } catch {
      /* noop */
    }
    const values = Array.isArray(parsedVal) ? (parsedVal as unknown[]) : [parsedVal];
    return {
      id: e.id,
      ledger: e.ledger,
      txHash: e.txHash,
      topic0: String(topics[0] ?? ""),
      values,
    };
  });
}
