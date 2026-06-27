import { useCallback, useEffect, useState } from "react";
import {
  openWalletModal,
  disconnectWallet,
  ensureKit,
  classifyError,
  type WalletError,
} from "@/lib/stellar/wallet";
import { fetchXlmBalance } from "@/lib/stellar/balance";

const LS_ADDR = "orbit:wallet:address";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ funded: boolean; xlm: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);

  // Hydrate persisted address (no signing yet — just remember the connection)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LS_ADDR);
    if (saved) setAddress(saved);
    ensureKit().catch(() => void 0);
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
      const { address: addr } = await openWalletModal();
      setAddress(addr);
      localStorage.setItem(LS_ADDR, addr);
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
    } catch {}
    localStorage.removeItem(LS_ADDR);
    setAddress(null);
    setBalance(null);
  }, []);

  return { address, balance, loading, error, connect, disconnect, refreshBalance };
}
