import { useEffect, useState } from "react";
import { checkRpcHealth, type HealthResult } from "@/lib/stellar/health";

export function NetworkStatusBar() {
  const [health, setHealth] = useState<HealthResult | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const h = await checkRpcHealth();
      if (mounted) setHealth(h);
    }
    check();
    const t = setInterval(check, 30_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const dot = health == null ? "" : health.status;
  const label =
    health == null
      ? "Checking…"
      : health.status === "down"
        ? "RPC Offline"
        : health.status === "slow"
          ? `${health.latencyMs}ms · Slow`
          : `${health.latencyMs}ms`;

  const ledger = health?.ledger;

  return (
    <div className="flex items-center gap-2">
      <div className={`net-dot ${dot}`} />
      <span className="font-mono text-[10px] text-[var(--orbit-mute)] hidden sm:inline">{label}</span>
      {ledger != null && (
        <span className="font-mono text-[10px] text-[var(--orbit-mute)]/60 hidden md:inline">
          · #{ledger.toLocaleString()}
        </span>
      )}
    </div>
  );
}
