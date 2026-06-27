/**
 * StellarWalletsKit singleton — multi-wallet support on Testnet.
 * Lazy-loaded so SSR doesn't try to touch window.
 */
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

let kitPromise: Promise<StellarWalletsKit> | null = null;

export async function getKit(): Promise<StellarWalletsKit> {
  if (typeof window === "undefined") {
    throw new Error("Wallet kit is browser-only");
  }
  if (!kitPromise) {
    kitPromise = (async () => {
      const mod = await import("@creit.tech/stellar-wallets-kit");
      const {
        StellarWalletsKit: Kit,
        WalletNetwork,
        FREIGHTER_ID,
        FreighterModule,
        AlbedoModule,
        xBullModule,
        LobstrModule,
      } = mod;
      return new Kit({
        network: WalletNetwork.TESTNET,
        selectedWalletId: FREIGHTER_ID,
        modules: [
          new FreighterModule(),
          new AlbedoModule(),
          new xBullModule(),
          new LobstrModule(),
        ],
      });
    })();
  }
  return kitPromise;
}

export type WalletError =
  | { kind: "not_installed"; message: string }
  | { kind: "rejected"; message: string }
  | { kind: "insufficient"; message: string }
  | { kind: "network"; message: string }
  | { kind: "unknown"; message: string };

export function classifyError(err: unknown): WalletError {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("not installed") || lower.includes("not found") || lower.includes("no wallet")) {
    return { kind: "not_installed", message: "Wallet not installed or unavailable." };
  }
  if (lower.includes("reject") || lower.includes("declined") || lower.includes("user denied") || lower.includes("cancel")) {
    return { kind: "rejected", message: "Transaction rejected in wallet." };
  }
  if (lower.includes("insufficient") || lower.includes("underfunded") || lower.includes("op_underfunded")) {
    return { kind: "insufficient", message: "Insufficient balance to cover amount + network fees." };
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
    return { kind: "network", message: "Network error — check Testnet connectivity." };
  }
  return { kind: "unknown", message: msg || "Unknown error." };
}