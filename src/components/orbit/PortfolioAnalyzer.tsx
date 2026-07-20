/**
 * PortfolioAnalyzer — Feature 2
 * Real on-chain cost basis analysis, break-even price, real yield trajectory from price history.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Target, TrendingUp, Clock, DollarSign } from "lucide-react";
import { computePnl, type PriceSnapshot, type VaultState } from "@/lib/stellar/vault";
import { stroopsToXlm, STROOPS_PER_XLM } from "@/lib/stellar/network";
import { fetchXlmUsdPrice } from "@/lib/oracle-price";

function RealYieldChart({ history, apyBps }: { history: PriceSnapshot[]; apyBps: bigint }) {
  const w = 500;
  const h = 100;
  const pad = 12;

  const hasReal = history.length >= 2;
  const apyPct = Number(apyBps > 0n ? apyBps : 525n) / 100;
  const monthlyRate = Math.pow(1 + apyPct / 100, 1 / 12) - 1;

  // Projected series (6 months from today)
  const baseValue = hasReal
    ? Number(history[history.length - 1].priceScaled) / Number(STROOPS_PER_XLM)
    : 1.0;
  const projectedCount = 12;
  const projected = Array.from({ length: projectedCount }, (_, i) =>
    baseValue * Math.pow(1 + monthlyRate, i)
  );

  // Real history series (normalized to same scale)
  const realValues = hasReal
    ? history.map((s) => Number(s.priceScaled) / Number(STROOPS_PER_XLM))
    : [1.0, 1.0];

  const allValues = [...realValues, ...projected];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const rangeV = maxV - minV || 0.0001;

  function toY(v: number) {
    return pad + ((maxV - v) / rangeV) * (h - pad * 2);
  }

  // Scales x positions for real history (left portion) and projected (right portion)
  const splitX = w * 0.4; // real history takes left 40%
  const realPts = realValues.map((v, i) => {
    const x = pad + (i / Math.max(realValues.length - 1, 1)) * (splitX - pad);
    return `${x},${toY(v)}`;
  });
  const projPts = projected.map((v, i) => {
    const x = splitX + (i / (projectedCount - 1)) * (w - splitX - pad);
    return `${x},${toY(v)}`;
  });

  const realPolyline = realPts.join(" ");
  const projPolyline = projPts.join(" ");

  const lastRealPt = realPts[realPts.length - 1];
  const firstProjPt = projPts[0];

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest">
        <div className="flex items-center gap-1.5">
          <div className="h-px w-6 bg-[var(--orbit-accent)]" />
          <span className="text-[var(--orbit-accent)]">Real Price History</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-px w-6"
            style={{
              background: "var(--orbit-warn)",
              borderTop: "1px dashed var(--orbit-warn)",
            }}
          />
          <span className="text-[var(--orbit-warn)]">Projected ({apyPct.toFixed(2)}% APY)</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
        <defs>
          <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.16 195)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="oklch(0.82 0.16 195)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 65)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="oklch(0.78 0.16 65)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Vertical divider at split */}
        <line x1={splitX} y1={pad} x2={splitX} y2={h - pad} stroke="oklch(1 0 0 / 0.1)" strokeWidth="1" strokeDasharray="3,3" />
        {/* Real history area */}
        {hasReal && (
          <path
            d={`M${realPts[0]} L${realPolyline} L${realPts[realPts.length - 1].split(",")[0]},${h - pad} L${pad},${h - pad} Z`}
            fill="url(#realGrad)"
          />
        )}
        {/* Real history line */}
        <polyline
          points={realPolyline}
          fill="none"
          stroke="oklch(0.82 0.16 195)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Connection line */}
        <line
          x1={lastRealPt?.split(",")[0]}
          y1={lastRealPt?.split(",")[1]}
          x2={firstProjPt?.split(",")[0]}
          y2={firstProjPt?.split(",")[1]}
          stroke="oklch(0.78 0.16 65)"
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity="0.5"
        />
        {/* Projected area */}
        <path
          d={`M${projPts[0]} L${projPolyline} L${projPts[projPts.length - 1].split(",")[0]},${h - pad} L${splitX},${h - pad} Z`}
          fill="url(#projGrad)"
        />
        {/* Projected line */}
        <polyline
          points={projPolyline}
          fill="none"
          stroke="oklch(0.78 0.16 65)"
          strokeWidth="1.5"
          strokeDasharray="5,3"
          strokeLinecap="round"
        />
        {/* End dot */}
        <circle
          cx={projPts[projPts.length - 1].split(",")[0]}
          cy={projPts[projPts.length - 1].split(",")[1]}
          r="4"
          fill="oklch(0.78 0.16 65)"
          style={{ filter: "drop-shadow(0 0 6px oklch(0.78 0.16 65))" }}
        />
      </svg>
    </div>
  );
}

export function PortfolioAnalyzer({
  address,
  state,
  priceHistory,
}: {
  address: string;
  state: VaultState;
  priceHistory: PriceSnapshot[];
}) {
  const [pnl, setPnl] = useState<Awaited<ReturnType<typeof computePnl>>>(null);
  const [xlmUsd, setXlmUsd] = useState<number | null>(null);

  useEffect(() => {
    if (address && state.userSharesStroops > 0n) {
      computePnl(address, state, "xlm").then(setPnl);
    }
    fetchXlmUsdPrice().then(setXlmUsd);
  }, [address, state.userSharesStroops, state.pricePerShareScaled]);

  const userSharesXlm = Number(stroopsToXlm(state.userSharesStroops));
  const totalAssetsXlm = Number(stroopsToXlm(state.totalAssetsStroops));
  const totalSharesXlm = Number(stroopsToXlm(state.totalSharesStroops));
  const currentNav = totalSharesXlm > 0 ? totalAssetsXlm / totalSharesXlm : 1.0;

  const apyPct = Number(state.apyBps > 0n ? state.apyBps : 525n) / 100;

  // Break-even price: if they bought at entry price, when does current NAV exceed it?
  const entryNav = pnl ? Number(pnl.entryPriceScaled) / Number(STROOPS_PER_XLM) : currentNav;
  const breakEvenNav = entryNav; // already at break-even if nav > entry

  // Days to +10%
  const dailyRate = Math.pow(1 + apyPct / 100, 1 / 365) - 1;
  const daysTo10pct = dailyRate > 0 ? Math.log(1.1) / Math.log(1 + dailyRate) : Infinity;

  // Portfolio share of total vault
  const portfolioShare =
    totalSharesXlm > 0 ? (userSharesXlm / totalSharesXlm) * 100 : 0;

  if (state.userSharesStroops === 0n) {
    return (
      <div className="orbit-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--orbit-accent)]/10">
            <BarChart2 className="h-4 w-4 text-[var(--orbit-accent)]" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">Portfolio Analyzer</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
              Cost basis · Yield trajectory · Break-even
            </div>
          </div>
        </div>
        <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02]">
          <p className="font-mono text-xs text-[var(--orbit-mute)]">
            Deposit to see your portfolio analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="orbit-card p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--orbit-accent)]/10">
          <BarChart2 className="h-4 w-4 text-[var(--orbit-accent)]" />
        </div>
        <div>
          <div className="font-display text-sm font-semibold">Portfolio Analyzer</div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
            Real on-chain analysis · {priceHistory.length} data points
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="h-3 w-3 text-[var(--orbit-mute)]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Entry NAV</span>
          </div>
          <div className="font-display text-base font-bold text-[var(--orbit-ink)]">
            {entryNav.toFixed(6)}
          </div>
          <div className="font-mono text-[9px] text-[var(--orbit-mute)]">XLM/share at deposit</div>
        </div>

        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-[var(--orbit-mute)]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Current NAV</span>
          </div>
          <div className={`font-display text-base font-bold ${currentNav >= entryNav ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"}`}>
            {currentNav.toFixed(6)}
          </div>
          <div className="font-mono text-[9px] text-[var(--orbit-mute)]">XLM/share live</div>
        </div>

        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 mb-1">
            <Target className="h-3 w-3 text-[var(--orbit-mute)]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Break-even</span>
          </div>
          <div className={`font-display text-base font-bold ${currentNav >= breakEvenNav ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-warn)]"}`}>
            {currentNav >= breakEvenNav ? "✓ MET" : breakEvenNav.toFixed(6)}
          </div>
          <div className="font-mono text-[9px] text-[var(--orbit-mute)]">
            {currentNav >= breakEvenNav ? "In profit" : "Target price"}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-[var(--orbit-mute)]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Days to +10%</span>
          </div>
          <div className="font-display text-base font-bold text-[var(--orbit-warn)]">
            {isFinite(daysTo10pct) ? Math.ceil(daysTo10pct) : "∞"}
          </div>
          <div className="font-mono text-[9px] text-[var(--orbit-mute)]">at {apyPct.toFixed(2)}% APY</div>
        </div>
      </div>

      {/* PnL if available */}
      {pnl && (
        <div className={`rounded-xl border p-4 ${pnl.earnedStroops >= 0n ? "border-[var(--orbit-ok)]/30 bg-[var(--orbit-ok)]/5" : "border-[var(--orbit-danger)]/30 bg-[var(--orbit-danger)]/5"}`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              Unrealized P&L
            </span>
            <span className={`font-display text-xl font-bold ${pnl.earnedStroops >= 0n ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"}`}>
              {pnl.earnedStroops >= 0n ? "+" : ""}{stroopsToXlm(pnl.earnedStroops > 0n ? pnl.earnedStroops : -pnl.earnedStroops)} XLM
              <span className="ml-2 text-sm font-normal">({pnl.earnedPct >= 0 ? "+" : ""}{pnl.earnedPct.toFixed(2)}%)</span>
            </span>
          </div>
          {xlmUsd && (
            <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">
              ≈ ${(Math.abs(Number(stroopsToXlm(pnl.earnedStroops))) * xlmUsd).toFixed(2)} USD
            </div>
          )}
        </div>
      )}

      {/* Portfolio share */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
          Your vault share
        </span>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[var(--orbit-accent)]"
              style={{ width: `${Math.min(portfolioShare, 100)}%` }}
            />
          </div>
          <span className="font-mono text-sm font-bold text-[var(--orbit-accent)]">
            {portfolioShare.toFixed(4)}%
          </span>
        </div>
      </div>

      {/* Real yield chart */}
      <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
          Yield Trajectory — Real History + Projection
        </div>
        <RealYieldChart history={priceHistory} apyBps={state.apyBps} />
      </div>
    </motion.div>
  );
}
