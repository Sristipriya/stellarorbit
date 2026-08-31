import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Layers, PieChart, Activity,
  ShieldAlert, RefreshCcw, DollarSign, ArrowUpRight, ChevronRight,
  Zap, Lock, Percent, Compass, Calculator, Wallet
} from "lucide-react";
import { computePnl, type PriceSnapshot, type VaultState } from "@/lib/stellar/vault";
import { stroopsToXlm, STROOPS_PER_XLM } from "@/lib/stellar/network";
import { fetchXlmUsdPrice } from "@/lib/oracle-price";
import { getUserTransactions, type UserTransaction } from "@/lib/user-transactions";

interface PortfolioProps {
  address: string;
  state: VaultState;
  priceHistory: PriceSnapshot[];
}

export function PortfolioAnalyzer({ address, state, priceHistory }: PortfolioProps) {
  const [pnl, setPnl] = useState<Awaited<ReturnType<typeof computePnl>>>(null);
  const [xlmUsd, setXlmUsd] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "simulator" | "risk">("overview");

  // Simulator state
  const [simAmount, setSimAmount] = useState<number>(1000);
  const [simMonths, setSimMonths] = useState<number>(12);
  const [txs, setTxs] = useState<UserTransaction[]>([]);

  useEffect(() => {
    if (address) {
      if (state.userSharesStroops > 0n) {
        computePnl(address, state, "xlm").then(setPnl);
      }
      getUserTransactions(address).then(setTxs);
    }
    fetchXlmUsdPrice().then(setXlmUsd);
  }, [address, state.userSharesStroops, state.pricePerShareScaled]);

  const userSharesXlm = Number(stroopsToXlm(state.userSharesStroops));
  const totalAssetsXlm = Number(stroopsToXlm(state.totalAssetsStroops));
  const totalSharesXlm = Number(stroopsToXlm(state.totalSharesStroops));
  const currentNav = totalSharesXlm > 0 ? totalAssetsXlm / totalSharesXlm : 1.0;

  const apyPct = Number(state.apyBps > 0n ? state.apyBps : 525n) / 100;
  const portfolioSharePct = totalSharesXlm > 0 ? (userSharesXlm / totalSharesXlm) * 100 : 0;

  const netWorthXlm = userSharesXlm * currentNav;
  const netWorthUsd = xlmUsd ? netWorthXlm * xlmUsd : null;

  const entryNav = pnl ? Number(pnl.entryPriceScaled) / Number(STROOPS_PER_XLM) : currentNav;
  const unrealizedXlm = pnl ? Number(stroopsToXlm(pnl.earnedStroops)) : 0;
  const unrealizedPct = pnl ? pnl.earnedPct : 0;

  // Growth simulation calculations
  const monthlyRate = Math.pow(1 + apyPct / 100, 1 / 12) - 1;
  const simYieldXlm = simAmount * (Math.pow(1 + monthlyRate, simMonths) - 1);
  const simFinalXlm = simAmount + simYieldXlm;

  return (
    <div className="space-y-6 text-[var(--orbit-ink)]">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--orbit-edge)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[var(--orbit-accent)]" />
            <h2 className="font-display text-xl font-bold tracking-tight text-white">Portfolio Command Center</h2>
          </div>
          <p className="font-mono text-xs text-[var(--orbit-mute)]">
            Institutional position telemetry, cost-basis analysis & yield projections
          </p>
        </div>

        {/* View Selector Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-1">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "breakdown", label: "Assets", icon: PieChart },
            { id: "simulator", label: "Simulator", icon: Calculator },
            { id: "risk", label: "Risk Radar", icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                  active
                    ? "bg-[var(--orbit-accent)] text-black"
                    : "text-[var(--orbit-mute)] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Net Worth Stat Panel */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Net Worth */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Portfolio Net Worth</span>
            <Wallet className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {netWorthUsd != null ? `$${netWorthUsd.toFixed(2)}` : `${netWorthXlm.toFixed(2)} XLM`}
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            {netWorthXlm.toFixed(4)} XLM Position
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Unrealized Return</span>
            {unrealizedPct >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-[var(--orbit-ok)]" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-[var(--orbit-danger)]" />
            )}
          </div>
          <div className={`font-display text-2xl font-bold ${unrealizedPct >= 0 ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"}`}>
            {unrealizedPct >= 0 ? "+" : ""}{unrealizedXlm.toFixed(2)} XLM
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            {unrealizedPct >= 0 ? "+" : ""}{unrealizedPct.toFixed(2)}% total return
          </div>
        </div>

        {/* Current Vault NAV */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Share NAV</span>
            <Activity className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {currentNav.toFixed(6)}
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            Entry: {entryNav.toFixed(6)} XLM
          </div>
        </div>

        {/* Vault Share Ownership */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Vault Ownership</span>
            <Percent className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-[var(--orbit-accent)]">
            {portfolioSharePct.toFixed(4)}%
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[var(--orbit-accent)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(portfolioSharePct * 5, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab Dynamic Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Performance Chart Component */}
            <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-white">Personalized Net Worth & PnL Curve</h3>
                  <p className="font-mono text-xs text-[var(--orbit-mute)]">
                    Your real historical balances mapped against vault APY trajectory
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="flex items-center gap-1.5 text-[var(--orbit-accent)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--orbit-accent)]" /> Historical Portfolio Value
                  </span>
                  <span className="flex items-center gap-1.5 text-[var(--orbit-warn)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--orbit-warn)]" /> Projected Value ({apyPct.toFixed(2)}% APY)
                  </span>
                </div>
              </div>
              <UserPnLChart history={priceHistory} txs={txs} apyBps={state.apyBps} />
            </div>

            {/* Position Summary Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6">
                <h4 className="font-display text-sm font-bold text-white mb-4">Cost-Basis Analysis</h4>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-[var(--orbit-edge)]">
                    <span className="text-[var(--orbit-mute)]">Initial Entry Price</span>
                    <span className="font-semibold text-white">{entryNav.toFixed(6)} XLM / share</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--orbit-edge)]">
                    <span className="text-[var(--orbit-mute)]">Live Share Price</span>
                    <span className="font-semibold text-[var(--orbit-ok)]">{currentNav.toFixed(6)} XLM / share</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--orbit-edge)]">
                    <span className="text-[var(--orbit-mute)]">Break-Even Threshold</span>
                    <span className="font-semibold text-[var(--orbit-accent)]">
                      {currentNav >= entryNav ? "✓ Target Exceeded" : `${entryNav.toFixed(6)} XLM`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[var(--orbit-mute)]">Total Shares Held</span>
                    <span className="font-semibold text-white">{userSharesXlm.toFixed(4)} oXLM</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6">
                <h4 className="font-display text-sm font-bold text-white mb-4">Yield Trajectory Summary</h4>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-[var(--orbit-edge)]">
                    <span className="text-[var(--orbit-mute)]">Current Vault APY</span>
                    <span className="font-semibold text-[var(--orbit-accent)]">{apyPct.toFixed(2)}% APY</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--orbit-edge)]">
                    <span className="text-[var(--orbit-mute)]">Daily Compounding Rate</span>
                    <span className="font-semibold text-white">{((Math.pow(1 + apyPct / 100, 1 / 365) - 1) * 100).toFixed(4)}% / day</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--orbit-edge)]">
                    <span className="text-[var(--orbit-mute)]">Est. 30-Day Earnings</span>
                    <span className="font-semibold text-[var(--orbit-ok)]">
                      +{(netWorthXlm * (Math.pow(1 + apyPct / 100, 30 / 365) - 1)).toFixed(2)} XLM
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[var(--orbit-mute)]">Est. 1-Year Earnings</span>
                    <span className="font-semibold text-[var(--orbit-ok)]">
                      +{(netWorthXlm * (apyPct / 100)).toFixed(2)} XLM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "breakdown" && (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6 backdrop-blur-md space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-white">Asset Allocation Matrix</h3>
                <p className="font-mono text-xs text-[var(--orbit-mute)]">
                  Detailed distribution across Vault Shares, Principal Tokens (PT), and Yield Tokens (YT)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: "oXLM Vault Shares", type: "Vault Asset", amount: `${userSharesXlm.toFixed(4)} oXLM`, value: `${netWorthXlm.toFixed(2)} XLM`, pct: "100%" },
                { name: "Principal Tokens (PT)", type: "Yield Tranche", amount: "0.0000 PT", value: "0.00 XLM", pct: "0%" },
                { name: "Yield Tokens (YT)", type: "Yield Tranche", amount: "0.0000 YT", value: "0.00 XLM", pct: "0%" },
              ].map((asset) => (
                <div key={asset.name} className="flex flex-col gap-3 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--orbit-edge)] bg-black/40 font-mono font-bold text-xs">
                      {asset.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-white">{asset.name}</div>
                      <div className="font-mono text-[10px] text-[var(--orbit-mute)]">{asset.type}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 font-mono text-xs text-right">
                    <div>
                      <div className="font-bold text-white">{asset.amount}</div>
                      <div className="text-[10px] text-[var(--orbit-mute)]">Holding Balance</div>
                    </div>
                    <div>
                      <div className="font-bold text-[var(--orbit-accent)]">{asset.value}</div>
                      <div className="text-[10px] text-[var(--orbit-mute)]">Valuation</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "simulator" && (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6 backdrop-blur-md space-y-6"
          >
            <div>
              <h3 className="font-display text-base font-bold text-white">Interactive Compound Simulator</h3>
              <p className="font-mono text-xs text-[var(--orbit-mute)]">
                Simulate prospective yield growth over custom time horizons at live APY
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--orbit-mute)] mb-2">
                    Principal Input (XLM): <span className="font-bold text-white">{simAmount} XLM</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full accent-[var(--orbit-accent)]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--orbit-mute)] mb-2">
                    Time Horizon (Months): <span className="font-bold text-white">{simMonths} Months</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="36"
                    step="1"
                    value={simMonths}
                    onChange={(e) => setSimMonths(Number(e.target.value))}
                    className="w-full accent-[var(--orbit-accent)]"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/5 p-5 flex flex-col justify-between font-mono">
                <div>
                  <div className="text-xs uppercase text-[var(--orbit-mute)]">Simulated Projection</div>
                  <div className="mt-2 font-display text-3xl font-bold text-white">
                    {simFinalXlm.toFixed(2)} XLM
                  </div>
                  <div className="mt-1 text-xs text-[var(--orbit-ok)]">
                    +{simYieldXlm.toFixed(2)} XLM (+{((simYieldXlm / simAmount) * 100).toFixed(2)}%)
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--orbit-edge)] text-[10px] text-[var(--orbit-mute)] flex justify-between">
                  <span>Target APY: {apyPct.toFixed(2)}%</span>
                  <span>Compounding: Continuous</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "risk" && (
          <motion.div
            key="risk"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6 backdrop-blur-md space-y-6"
          >
            <div>
              <h3 className="font-display text-base font-bold text-white">Position Risk Telemetry</h3>
              <p className="font-mono text-xs text-[var(--orbit-mute)]">
                Health factors, vault utilization, and collateral maintenance monitors
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 font-mono text-xs">
              <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4">
                <div className="text-[var(--orbit-mute)] mb-1">Health Score</div>
                <div className="font-display text-2xl font-bold text-[var(--orbit-ok)]">100 / 100</div>
                <div className="text-[10px] text-[var(--orbit-mute)] mt-1">Optimal Solvency</div>
              </div>

              <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4">
                <div className="text-[var(--orbit-mute)] mb-1">Collateralization</div>
                <div className="font-display text-2xl font-bold text-white">Unleveraged</div>
                <div className="text-[10px] text-[var(--orbit-mute)] mt-1">Zero liquidation risk</div>
              </div>

              <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4">
                <div className="text-[var(--orbit-mute)] mb-1">Strategy Exposure</div>
                <div className="font-display text-2xl font-bold text-[var(--orbit-accent)]">Blend Lending</div>
                <div className="text-[10px] text-[var(--orbit-mute)] mt-1">Single-asset XLM pool</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserPnLChart({ history, txs, apyBps }: { history: PriceSnapshot[]; txs: UserTransaction[]; apyBps: bigint }) {
  const w = 600;
  const h = 140;
  const pad = 16;

  const hasReal = history.length >= 2;
  const apyPct = Number(apyBps > 0n ? apyBps : 525n) / 100;
  const monthlyRate = Math.pow(1 + apyPct / 100, 1 / 12) - 1;

  // Compute historical user balances
  // txs are sorted by created_at descending from the DB, so we reverse it
  const sortedTxs = [...txs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const realValues = history.map((snap) => {
    const t = snap.timestamp; // snapshot timestamp in ms
    let shares = 0;
    for (const tx of sortedTxs) {
      if (new Date(tx.created_at).getTime() <= t) {
        if (tx.status === "success" && tx.shares) {
          const numShares = Number(tx.shares);
          if (tx.type === "deposit") shares += numShares;
          else if (tx.type === "withdraw") shares -= numShares;
        }
      } else {
        break;
      }
    }
    const nav = Number(snap.priceScaled) / Number(STROOPS_PER_XLM);
    return shares > 0 ? shares * nav : 0;
  });
  
  if (!hasReal || realValues.length === 0) {
    realValues.push(0, 0);
  }

  const baseValue = realValues[realValues.length - 1];
  const projectedCount = 10;
  const projected = Array.from({ length: projectedCount }, (_, i) =>
    baseValue * Math.pow(1 + monthlyRate, i)
  );

  const allValues = [...realValues, ...projected];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const rangeV = maxV - minV || 0.0001;

  function toY(v: number) {
    return pad + ((maxV - v) / rangeV) * (h - pad * 2);
  }

  const splitX = w * 0.45;
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

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
      {/* Grid lines */}
      <line x1={pad} y1={pad} x2={w - pad} y2={pad} stroke="var(--orbit-edge)" strokeDasharray="3,3" />
      <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="var(--orbit-edge)" strokeDasharray="3,3" />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--orbit-edge)" strokeDasharray="3,3" />
      <line x1={splitX} y1={pad} x2={splitX} y2={h - pad} stroke="var(--orbit-edge)" strokeWidth="1.5" />

      {/* Real history line */}
      <polyline points={realPolyline} fill="none" stroke="var(--orbit-accent)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Projected line */}
      <polyline points={projPolyline} fill="none" stroke="var(--orbit-warn)" strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" />
    </svg>
  );
}