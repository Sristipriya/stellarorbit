/**
 * VaultHealthMonitor — Feature 1
 * Real-time vault health: oracle price, utilization gauge, share price drift, live refresh.
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, RefreshCcw, Zap, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fetchXlmUsdPrice } from "@/lib/oracle-price";
import { stroopsToXlm, STROOPS_PER_XLM } from "@/lib/stellar/network";
import { type VaultState } from "@/lib/stellar/vault";

// Vault capacity cap for utilization (200,000 XLM for testnet demo)
const VAULT_CAP_STROOPS = 200_000n * 10_000_000n;

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(value);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setDisplayed(value);
    setKey((k) => k + 1);
  }, [value]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={key}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className="inline-block orbit-number"
      >
        {displayed.toFixed(decimals)}
      </motion.span>
    </AnimatePresence>
  );
}

function UtilizationGauge({ pct }: { pct: number }) {
  const color =
    pct > 85 ? "var(--orbit-danger)" : pct > 60 ? "var(--orbit-warn)" : "var(--orbit-ok)";
  const statusText = pct > 85 ? "HIGH" : pct > 60 ? "MODERATE" : "HEALTHY";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
        <span className="text-[var(--orbit-mute)]">Vault Utilization</span>
        <span style={{ color }} className="font-bold">
          {statusText}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-[var(--orbit-mute)]">
        <span>0 XLM</span>
        <span className="font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
        <span>200K XLM</span>
      </div>
    </div>
  );
}

function PriceDrift({ pricePerShare }: { pricePerShare: number }) {
  const drift = (pricePerShare - 1.0) * 100;
  const isUp = drift >= 0;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          isUp ? "bg-[var(--orbit-ok)]/15" : "bg-[var(--orbit-danger)]/15"
        }`}
      >
        <TrendingUp
          className={`h-4 w-4 ${isUp ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"}`}
          style={{ transform: isUp ? "none" : "scaleY(-1)" }}
        />
      </div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
          Share Price Drift
        </div>
        <div
          className={`font-display text-lg font-semibold ${
            isUp ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"
          }`}
        >
          {isUp ? "+" : ""}
          {drift.toFixed(4)}%
        </div>
      </div>
    </div>
  );
}

export function VaultHealthMonitor({
  state,
  onRefresh,
}: {
  state: VaultState;
  onRefresh: () => void;
}) {
  const [xlmUsd, setXlmUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const price = await fetchXlmUsdPrice();
      setXlmUsd(price);
      setLastUpdated(new Date());
      setPulse((p) => p + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      refresh();
      onRefresh();
    }, 30_000);
    return () => clearInterval(t);
  }, [refresh, onRefresh]);

  const totalAssetsXlm = Number(stroopsToXlm(state.totalAssetsStroops));
  const totalSharesXlm = Number(stroopsToXlm(state.totalSharesStroops));
  const pricePerShare =
    totalSharesXlm > 0 ? totalAssetsXlm / totalSharesXlm : 1.0;

  const utilizationPct =
    Number(state.totalAssetsStroops) / Number(VAULT_CAP_STROOPS) * 100;

  const tvlUsd = xlmUsd ? totalAssetsXlm * xlmUsd : null;

  const healthScore =
    utilizationPct > 85
      ? { label: "CRITICAL", color: "var(--orbit-danger)" }
      : utilizationPct > 60
      ? { label: "STABLE", color: "var(--orbit-warn)" }
      : { label: "OPTIMAL", color: "var(--orbit-ok)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="orbit-card orbit-scan relative overflow-hidden p-5"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--orbit-ok)]/15">
            <Activity className="h-4 w-4 text-[var(--orbit-ok)]" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">Vault Health Monitor</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
              SEP-40 oracle · auto-refresh 30s
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="orbit-badge"
            style={{
              background: `color-mix(in oklab, ${healthScore.color} 15%, transparent)`,
              color: healthScore.color,
            }}
          >
            <span className="live-dot" style={{ background: healthScore.color, boxShadow: `0 0 6px ${healthScore.color}` }} />
            {healthScore.label}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--orbit-edge)] text-[var(--orbit-mute)] transition-all hover:border-[var(--orbit-accent)] hover:text-[var(--orbit-accent)]"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4-column metrics */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* XLM/USD Oracle */}
        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-[var(--orbit-warn)]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
              XLM / USD
            </span>
          </div>
          <div className="font-display text-xl font-bold text-[var(--orbit-warn)]">
            {xlmUsd ? (
              <>
                $<AnimatedNumber value={xlmUsd} decimals={4} />
              </>
            ) : (
              <span className="orbit-shimmer inline-block h-6 w-20 rounded" />
            )}
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-[var(--orbit-mute)]">SEP-40 feed</div>
        </div>

        {/* TVL */}
        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
            TVL
          </div>
          <div className="font-display text-xl font-bold text-[var(--orbit-accent)]">
            <AnimatedNumber value={totalAssetsXlm} decimals={2} />
            <span className="ml-1 text-sm font-normal text-[var(--orbit-mute)]">XLM</span>
          </div>
          {tvlUsd && (
            <div className="mt-0.5 font-mono text-[9px] text-[var(--orbit-mute)]">
              ≈ ${tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          )}
        </div>

        {/* Share Price */}
        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
            NAV / Share
          </div>
          <div className="font-display text-xl font-bold text-[var(--orbit-ink)]">
            <AnimatedNumber value={pricePerShare} decimals={6} />
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-[var(--orbit-mute)]">XLM per share</div>
        </div>

        {/* APY */}
        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
            Live APY
          </div>
          <div className="font-display text-xl font-bold text-[var(--orbit-ok)]">
            <AnimatedNumber
              value={state.apyBps > 0n ? Number(state.apyBps) / 100 : 5.25}
              decimals={2}
            />
            <span className="ml-0.5 text-sm font-normal">%</span>
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-[var(--orbit-mute)]">7-day annualized</div>
        </div>
      </div>

      {/* Utilization gauge */}
      <div className="mb-4 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4">
        <UtilizationGauge pct={utilizationPct} />
      </div>

      {/* Share price drift + health checks */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PriceDrift pricePerShare={pricePerShare} />
        <div className="flex gap-3">
          {[
            { label: "Oracle", ok: xlmUsd !== null },
            { label: "Contract", ok: state.totalSharesStroops > 0n },
            { label: "Liquidity", ok: utilizationPct < 90 },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-1.5">
              {c.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--orbit-ok)]" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-[var(--orbit-warn)]" />
              )}
              <span className="font-mono text-[10px] text-[var(--orbit-mute)]">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-3 font-mono text-[9px] text-[var(--orbit-mute)]">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  );
}
