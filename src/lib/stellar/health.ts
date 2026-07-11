/**
 * RPC health check — measures Soroban Testnet RPC latency
 * and returns the latest ledger sequence number.
 */
import { NETWORK } from "./network";

export type HealthResult = {
  status: "ok" | "slow" | "down";
  latencyMs: number | null;
  ledger: number | null;
};

export async function checkRpcHealth(): Promise<HealthResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(NETWORK.sorobanRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger", params: {} }),
      signal: AbortSignal.timeout(6000),
    });
    const latencyMs = Date.now() - t0;
    if (!res.ok) return { status: "down", latencyMs, ledger: null };
    const json = (await res.json()) as { result?: { sequence?: number } };
    const ledger = json.result?.sequence ?? null;
    return {
      status: latencyMs < 800 ? "ok" : "slow",
      latencyMs,
      ledger,
    };
  } catch {
    return { status: "down", latencyMs: null, ledger: null };
  }
}
