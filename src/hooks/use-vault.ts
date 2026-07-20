import { useCallback, useEffect, useRef, useState } from "react";
import {
  getVaultState,
  getPriceHistory,
  ZERO_STATE,
  type VaultState,
  type PriceSnapshot,
} from "@/lib/stellar/vault";
import { pollActivity, resetActivityPoller, type ActivityEvent } from "@/lib/stellar/events";

const STATE_POLL_MS = 15_000;
const EVENT_POLL_MS = 8_000;

export function useVault(address: string | null, vaultId: string) {
  const [state, setState] = useState<VaultState>(ZERO_STATE);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addrRef = useRef(address);
  const vaultIdRef = useRef(vaultId);

  // reset poller cursors when the user (or contract id) changes
  useEffect(() => {
    addrRef.current = address;
    vaultIdRef.current = vaultId;
    resetActivityPoller();
    setEvents([]);
  }, [address, vaultId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, history] = await Promise.all([
        getVaultState(addrRef.current, vaultIdRef.current),
        getPriceHistory(vaultIdRef.current),
      ]);
      setState(s);
      setPriceHistory(history);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const pollEvents = useCallback(async () => {
    try {
      const fresh = await pollActivity(addrRef.current, vaultIdRef.current);
      if (fresh.length === 0) return;
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        const merged = [...fresh.filter((e) => !seen.has(e.id)), ...prev];
        merged.sort((a, b) => b.at - a.at);
        return merged.slice(0, 50);
      });
    } catch (e) {
      console.error("pollEvents error:", e);
    }
  }, []);

  // initial + interval state polling
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, STATE_POLL_MS);
    return () => clearInterval(t);
  }, [refresh, address, vaultId]);

  // initial + interval activity polling
  useEffect(() => {
    pollEvents();
    const t = setInterval(pollEvents, EVENT_POLL_MS);
    return () => clearInterval(t);
  }, [pollEvents, address, vaultId]);

  return { state, events, priceHistory, loading, error, refresh, pollEvents };
}
