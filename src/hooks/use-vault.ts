import { useCallback, useEffect, useState } from "react";
import { getVaultState, loadEvents, onActivity, type ActivityEvent, type VaultState } from "@/lib/stellar/vault";

export function useVault(address: string | null) {
  const [state, setState] = useState<VaultState>(() => getVaultState(address));
  const [events, setEvents] = useState<ActivityEvent[]>(() => (typeof window === "undefined" ? [] : loadEvents()));

  const refresh = useCallback(() => {
    setState(getVaultState(address));
    setEvents(loadEvents());
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const off = onActivity(() => refresh());
    return off;
  }, [refresh]);

  return { state, events, refresh };
}