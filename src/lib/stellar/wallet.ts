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

export type WalletError = {
  kind: "not_installed" | "rejected" | "insufficient" | "liquidity" | "auth" | "network" | "contract" | "unknown";
  title: string;
  message: string;
  suggestion?: string;
  rawDetails?: string;
};

export function classifyError(err: unknown): WalletError {
  let raw = "";
  if (err instanceof Error) {
    raw = err.stack ? `${err.message}\n${err.stack}` : err.message;
  } else if (typeof err === "object" && err !== null) {
    try {
      raw = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    } catch {
      raw = String(err);
    }
  } else {
    raw = String(err);
  }

  const lower = raw.toLowerCase();

  // 1. Wallet Extension & Connection Errors
  if (
    lower.includes("not installed") ||
    lower.includes("not found") ||
    lower.includes("no wallet") ||
    lower.includes("freighter is not installed")
  ) {
    return {
      kind: "not_installed",
      title: "Wallet Not Detected",
      message: "No compatible Stellar wallet extension was found in your browser.",
      suggestion: "Please install or enable Freighter, xBull, or Albedo to continue.",
      rawDetails: raw,
    };
  }

  if (
    lower.includes("reject") ||
    lower.includes("declined") ||
    lower.includes("user denied") ||
    lower.includes("cancel") ||
    lower.includes("user closed modal")
  ) {
    return {
      kind: "rejected",
      title: "Transaction Cancelled",
      message: "The transaction was rejected or cancelled in your wallet.",
      suggestion: "Confirm and approve the popup in your wallet to proceed.",
      rawDetails: raw,
    };
  }

  // 2. Soroban Contract Specific Traps & Invariants
  if (
    lower.includes("unreachablecodereached") ||
    lower.includes("insufficient idle assets") ||
    lower.includes("divest required") ||
    lower.includes("wasmvm, invalidaction")
  ) {
    if (lower.includes("withdraw") || lower.includes("wd")) {
      return {
        kind: "liquidity",
        title: "Vault Liquidity Limit",
        message: "The requested withdrawal exceeds the vault's currently available idle assets.",
        suggestion: "Reduce the withdrawal amount to fit within available vault idle liquidity.",
        rawDetails: raw,
      };
    }
    if (lower.includes("deposit") || lower.includes("dep")) {
      return {
        kind: "contract",
        title: "Deposit Invariant Failed",
        message: "The deposit amount or contract state invariant failed.",
        suggestion: "Ensure your deposit amount is positive and token approvals are confirmed.",
        rawDetails: raw,
      };
    }
    if (lower.includes("split") || lower.includes("wrap")) {
      return {
        kind: "contract",
        title: "Tranche Wrapping Invariant Failed",
        message: "Unable to wrap shares into PT and YT tokens with current vault state.",
        suggestion: "Ensure you hold sufficient shares and have approved the tranche contract.",
        rawDetails: raw,
      };
    }
    if (lower.includes("combine") || lower.includes("unwrap")) {
      return {
        kind: "contract",
        title: "Unwrapping Failed",
        message: "PT and YT token balances must match 1:1 to recombine into vault shares.",
        suggestion: "Ensure you hold equal amounts of PT and YT tokens before combining.",
        rawDetails: raw,
      };
    }
    return {
      kind: "contract",
      title: "Smart Contract Condition Failed",
      message: "The contract rejected this operation because a safety invariant or asset limit failed.",
      suggestion: "Check your transaction parameters and try with a smaller amount.",
      rawDetails: raw,
    };
  }

  // 3. Soroban Resource & Budget Limits
  if (lower.includes("error(budget") || lower.includes("exceeded cpu") || lower.includes("exceeded mem")) {
    return {
      kind: "contract",
      title: "Resource Budget Exceeded",
      message: "The transaction exceeded Soroban CPU or memory execution limits.",
      suggestion: "This is a network compute limit. Please retry with standard batch sizes.",
      rawDetails: raw,
    };
  }

  // 4. Soroban Auth Errors
  if (lower.includes("error(auth") || lower.includes("not authorized") || lower.includes("unauthorized")) {
    return {
      kind: "auth",
      title: "Authorization Failed",
      message: "The smart contract requires authority from an address that did not sign.",
      suggestion: "Ensure the connected account is the owner or manager of this position.",
      rawDetails: raw,
    };
  }

  // 5. Custom Contract Error Codes
  const contractErrMatch = raw.match(/Error\(Contract,\s*#?(\d+)\)/i);
  if (contractErrMatch) {
    const code = contractErrMatch[1];
    return {
      kind: "contract",
      title: `Contract Error #${code}`,
      message: `The smart contract returned error code #${code}.`,
      suggestion: "Check your token balances, allowances, and position status.",
      rawDetails: raw,
    };
  }

  // 6. Stellar Horizon & Core Protocol Errors
  if (
    lower.includes("op_underfunded") ||
    lower.includes("tx_insufficient_balance") ||
    lower.includes("insufficient balance")
  ) {
    return {
      kind: "insufficient",
      title: "Insufficient XLM Balance",
      message: "Your wallet does not have enough XLM to pay for this transaction and meet base reserve requirements.",
      suggestion: "Ensure you keep at least 1.5 to 2.0 XLM in your wallet to cover Stellar base reserves.",
      rawDetails: raw,
    };
  }

  if (lower.includes("op_low_reserve")) {
    return {
      kind: "insufficient",
      title: "Base Reserve Limit Reached",
      message: "Your account balance is too close to the Stellar minimum reserve (0.5 XLM per sub-entry + 1.0 XLM base).",
      suggestion: "Add more XLM to your wallet from the Faucet to increase available headroom.",
      rawDetails: raw,
    };
  }

  if (lower.includes("tx_bad_seq")) {
    return {
      kind: "network",
      title: "Sequence Out of Sync",
      message: "Your account's transaction sequence number changed before this transaction was submitted.",
      suggestion: "Please wait 5 seconds and retry your transaction.",
      rawDetails: raw,
    };
  }

  if (lower.includes("tx_insufficient_fee")) {
    return {
      kind: "network",
      title: "Network Fee Insufficient",
      message: "The fee offered was lower than current Stellar Testnet network fee requirements.",
      suggestion: "Please retry the transaction with updated network fees.",
      rawDetails: raw,
    };
  }

  if (lower.includes("op_no_trust") || lower.includes("op_no_destination")) {
    return {
      kind: "contract",
      title: "Missing Trustline",
      message: "The target token trustline is not established on your Stellar account.",
      suggestion: "Add the asset trustline in your wallet before receiving this token.",
      rawDetails: raw,
    };
  }

  if (lower.includes("tx_bad_auth")) {
    return {
      kind: "auth",
      title: "Signature Verification Failed",
      message: "The cryptographic signature provided does not match the account signers.",
      suggestion: "Re-connect your wallet and verify you are using the active account.",
      rawDetails: raw,
    };
  }

  // 7. Network / RPC Connectivity
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("timeout") ||
    lower.includes("504") ||
    lower.includes("502") ||
    lower.includes("503")
  ) {
    return {
      kind: "network",
      title: "Network Connection Timeout",
      message: "The Stellar Testnet RPC server is currently responding slowly or unreachable.",
      suggestion: "Please check your internet connection and retry in a moment.",
      rawDetails: raw,
    };
  }

  // 8. General / Fallback with clean extraction
  const cleanLine = raw
    .split("\n")[0]
    .replace(/^Error:\s*/i, "")
    .replace(/^simulate\([^)]+\):\s*/i, "")
    .slice(0, 140);

  return {
    kind: "unknown",
    title: "Transaction Failed",
    message: cleanLine || "An unexpected error occurred while processing the transaction.",
    suggestion: "Open the technical details below to inspect the on-chain debug log.",
    rawDetails: raw,
  };
}
