import { useCallback, useEffect, useState } from "react";
import {
  openWalletModal,
  disconnectWallet,
  ensureKit,
  restoreWalletConnection,
  classifyError,
  type WalletError,
} from "@/lib/stellar/wallet";
import { fetchXlmBalance } from "@/lib/stellar/balance";

const LS_ADDR = "orbit:wallet:address";
const LS_WALLET = "orbit:wallet:id";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ funded: boolean; xlm: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);

  // Hydrate persisted address and wallet connection state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedAddr = localStorage.getItem(LS_ADDR);
    const savedWallet = localStorage.getItem(LS_WALLET);
    if (savedAddr) setAddress(savedAddr);
    if (savedWallet) {
      restoreWalletConnection(savedWallet).catch(() => void 0);
    } else {
      ensureKit().catch(() => void 0);
    }
  }, []);

  const refreshBalance = useCallback(async (addr: string) => {
    const b = await fetchXlmBalance(addr);
    setBalance(b);
  }, []);

  useEffect(() => {
    if (!address) return;
    refreshBalance(address);
    const t = setInterval(() => refreshBalance(address), 12_000);
    return () => clearInterval(t);
  }, [address, refreshBalance]);

  const connect = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { address: addr, walletId } = await openWalletModal();
      setAddress(addr);
      localStorage.setItem(LS_ADDR, addr);
      if (walletId) localStorage.setItem(LS_WALLET, walletId);
      await refreshBalance(addr);
    } catch (e) {
      setError(classifyError(e));
    } finally {
      setLoading(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
    } catch (e) {
      console.error("Disconnect error:", e);
    }
    localStorage.removeItem(LS_ADDR);
    localStorage.removeItem(LS_WALLET);
    setAddress(null);
    setBalance(null);
  }, []);

  return { address, balance, loading, error, connect, disconnect, refreshBalance };
}
