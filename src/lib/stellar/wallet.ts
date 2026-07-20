/**
 * StellarWalletsKit (v2.x static API) — multi-wallet support on Testnet.
 * Lazy-initialised so SSR never touches window.
 */
let inited = false;
let initPromise: Promise<void> | null = null;

export async function ensureKit(): Promise<void> {
  if (typeof window === "undefined") throw new Error("Wallet kit is browser-only");
  if (inited) return;
  if (!initPromise) {
    initPromise = (async () => {
      const [{ StellarWalletsKit, Networks }, freighter, albedo, xbull, lobstr] = await Promise.all(
        [
          import("@creit.tech/stellar-wallets-kit"),
          import("@creit.tech/stellar-wallets-kit/modules/freighter"),
          import("@creit.tech/stellar-wallets-kit/modules/albedo"),
          import("@creit.tech/stellar-wallets-kit/modules/xbull"),
          import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
        ],
      );
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        selectedWalletId: freighter.FREIGHTER_ID,
        modules: [
          new freighter.FreighterModule(),
          new albedo.AlbedoModule(),
          new xbull.xBullModule(),
          new lobstr.LobstrModule(),
        ],
      });
      inited = true;
    })();
  }
  return initPromise;
}

export async function openWalletModal(): Promise<{ address: string; walletId?: string }> {
  await ensureKit();
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
  const res = await StellarWalletsKit.authModal();
  const walletId = StellarWalletsKit.selectedModule?.productId;
  return { address: res.address, walletId };
}

export async function restoreWalletConnection(walletId: string) {
  await ensureKit();
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
  StellarWalletsKit.setWallet(walletId);
}

/**
 * Returns true if the currently selected wallet module is alive and has
 * granted access to this dApp. Returns false if the session has expired
 * (e.g. Freighter returns "Freighter is not connected" after a page refresh).
 */
export async function verifyWalletConnection(): Promise<boolean> {
  try {
    await ensureKit();
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
    await StellarWalletsKit.getAddress();
    return true;
  } catch {
    return false;
  }
}

export async function signTx(xdr: string, networkPassphrase: string, address: string) {
  await ensureKit();
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
  return StellarWalletsKit.signTransaction(xdr, { networkPassphrase, address });
}

export async function disconnectWallet() {
  await ensureKit();
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
  await StellarWalletsKit.disconnect();
}

export type WalletError =
  | { kind: "not_installed"; message: string }
  | { kind: "rejected"; message: string }
  | { kind: "insufficient"; message: string }
  | { kind: "network"; message: string }
  | { kind: "unknown"; message: string };

export function classifyError(err: unknown): WalletError {
  let msg = "";
  if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === "object" && err !== null) {
    try {
      msg = JSON.stringify(err, Object.getOwnPropertyNames(err));
    } catch {
      msg = String(err);
    }
  } else {
    msg = String(err);
  }

  const lower = msg.toLowerCase();
  if (
    lower.includes("not installed") ||
    lower.includes("not found") ||
    lower.includes("no wallet")
  ) {
    return { kind: "not_installed", message: "Wallet not installed or unavailable." };
  }
  if (
    lower.includes("reject") ||
    lower.includes("declined") ||
    lower.includes("user denied") ||
    lower.includes("cancel")
  ) {
    return { kind: "rejected", message: "Transaction rejected in wallet." };
  }
  if (
    lower.includes("insufficient") ||
    lower.includes("underfunded") ||
    lower.includes("op_underfunded")
  ) {
    return {
      kind: "insufficient",
      message: "Insufficient balance to cover amount + network fees.",
    };
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
    return { kind: "network", message: "Network error — check Testnet connectivity." };
  }
  return { kind: "unknown", message: msg || "Unknown error." };
}
