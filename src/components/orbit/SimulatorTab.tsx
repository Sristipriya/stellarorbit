import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp } from "lucide-react";
import { type VaultState } from "@/lib/stellar/vault";
import { xlmToUsd } from "@/lib/oracle-price";

function pricePerShare(state: VaultState): number {
  if (state.totalSharesStroops === 0n) return 1.0;
  return Number(state.totalAssetsStroops) / Number(state.totalSharesStroops);
}

/** SVG sparkline — reusable, works for the simulator projection. */
function MiniChart({ values, color }: { values: number[]; color: string }) {
  const w = 500;
  const h = 80;
  const pad = 6;
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + ((max - v) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const first = pts.split(" ")[0];
  const last = pts.split(" ").at(-1)!;
  const area = `M${first} L${pts} L${last.split(",")[0]},${h} L${pad},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height: 80 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sg-sim-${color.slice(1, 5)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-sim-${color.slice(1, 5)})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SimulatorTab({
  state,
  xlmUsdPrice,
}: {
  state: VaultState;
  xlmUsdPrice: number | null;
}) {
  const currentPrice = pricePerShare(state);
  const [depositAmount, setDepositAmount] = useState("100");
  const [growthPct, setGrowthPct] = useState("5");
  const [days, setDays] = useState("30");

  const result = useMemo(() => {
    const dep = parseFloat(depositAmount) || 0;
    const g = parseFloat(growthPct) / 100;
    const d = parseInt(days) || 1;

    if (dep <= 0) return null;

    // Shares received at current price
    const sharesReceived = dep / currentPrice;

    // Projected share price after growth
    const projectedPrice = currentPrice * (1 + g);

    // Projected XLM value
    const projectedValue = sharesReceived * projectedPrice;
    const projectedPnl = projectedValue - dep;
    const projectedPnlPct = ((projectedValue - dep) / dep) * 100;

    // Chart: daily price curve
    const chartValues = Array.from({ length: Math.min(d + 1, 61) }, (_, i) => {
      const t = i / Math.min(d, 60);
      return dep * (1 + g * t);
    });

    return {
      sharesReceived,
      projectedPrice,
      projectedValue,
      projectedPnl,
      projectedPnlPct,
      chartValues,
      dep,
    };
  }, [depositAmount, growthPct, days, currentPrice]);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20">
            <Calculator className="h-4.5 w-4.5 text-[var(--orbit-accent)]" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Vault Simulator</h3>
            <p className="font-mono text-[10px] text-[var(--orbit-mute)]">
              Project your returns · uses live share price · no on-chain calls
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
              Deposit Amount (XLM)
            </label>
            <input
              type="number"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 font-mono text-lg outline-none focus:border-[var(--orbit-accent)] transition-colors text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)]"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
              Share Price Growth (%)
            </label>
            <input
              type="number"
              min="-100"
              max="1000"
              value={growthPct}
              onChange={(e) => setGrowthPct(e.target.value)}
              className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 font-mono text-lg outline-none focus:border-[var(--orbit-accent)] transition-colors text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)]"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
              Time Horizon (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 font-mono text-lg outline-none focus:border-[var(--orbit-accent)] transition-colors text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)]"
              placeholder="30"
            />
          </div>
        </div>
      </div>

      {result && (
        <motion.div
          key={`${depositAmount}-${growthPct}-${days}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-[var(--orbit-ok)]" />
            <span className="font-display text-sm font-semibold">Projected Outcome</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Shares Received", value: result.sharesReceived.toFixed(4) },
              { label: "Proj. Share Price", value: `${result.projectedPrice.toFixed(6)} XLM` },
              {
                label: "Projected Value",
                value: `${result.projectedValue.toFixed(4)} XLM`,
                sub: xlmUsdPrice
                  ? `≈ ${xlmToUsd(result.projectedValue.toFixed(4), xlmUsdPrice)}`
                  : undefined,
                accent: true,
              },
              {
                label: "Projected P&L",
                value: `${result.projectedPnl >= 0 ? "+" : ""}${result.projectedPnl.toFixed(4)} XLM`,
                sub: `${result.projectedPnlPct >= 0 ? "+" : ""}${result.projectedPnlPct.toFixed(2)}%`,
                green: result.projectedPnl >= 0,
                red: result.projectedPnl < 0,
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-[var(--orbit-edge)] bg-black/30 p-3"
              >
                <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1">
                  {c.label}
                </div>
                <div
                  className={`font-display text-base font-semibold ${c.accent ? "text-[var(--orbit-accent)]" : c.green ? "text-[var(--orbit-ok)]" : c.red ? "text-[var(--orbit-danger)]" : "text-[var(--orbit-ink)]"}`}
                >
                  {c.value}
                </div>
                {c.sub && (
                  <div className="font-mono text-[9px] text-[var(--orbit-mute)]">{c.sub}</div>
                )}
              </div>
            ))}
          </div>

          {/* Projection chart */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
              Value Projection over {days} days
            </div>
            <MiniChart
              values={result.chartValues}
              color={result.projectedPnl >= 0 ? "oklch(0.78 0.17 155)" : "oklch(0.7 0.21 25)"}
            />
          </div>

          <p className="font-mono text-[9px] text-[var(--orbit-mute)]">
            ⚠ Simulation only. Not financial advice. Uses current live share price (
            {currentPrice.toFixed(6)} XLM). Testnet assets only.
          </p>
        </motion.div>
      )}
    </div>
  );
}
