import { useCallback, useEffect, useRef, useState } from "react";
import { getVaultState, ZERO_STATE, type VaultState } from "@/lib/stellar/vault";
import { pollActivity, resetActivityPoller, type ActivityEvent } from "@/lib/stellar/events";

const STATE_POLL_MS = 15_000;
const EVENT_POLL_MS = 8_000;

export function useVault(address: string | null) {
  const [state, setState] = useState<VaultState>(ZERO_STATE);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addrRef = useRef(address);

  // reset poller cursors when the user (or contract id) changes
  useEffect(() => {
    addrRef.current = address;
    resetActivityPoller();
    setEvents([]);
  }, [address]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getVaultState(addrRef.current);
      setState(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const pollEvents = useCallback(async () => {
    try {
      const fresh = await pollActivity(addrRef.current);
      if (fresh.length === 0) return;
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        const merged = [...fresh.filter((e) => !seen.has(e.id)), ...prev];
        merged.sort((a, b) => b.at - a.at);
        return merged.slice(0, 50);
      });
    } catch {
      // swallow — keep last known events
    }
  }, []);

  // initial + interval state polling
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, STATE_POLL_MS);
    return () => clearInterval(t);
  }, [refresh, address]);

  // initial + interval activity polling
  useEffect(() => {
    pollEvents();
    const t = setInterval(pollEvents, EVENT_POLL_MS);
    return () => clearInterval(t);
  }, [pollEvents, address]);

  return { state, events, loading, error, refresh, pollEvents };
}
