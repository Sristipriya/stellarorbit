import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Flame,
  Coins,
  TrendingUp,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  RefreshCcw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useStaking } from "@/hooks/use-staking";
import {
  LOCK_PERIODS,
  type StakingPool,
  type StakingPosition
} from "@/lib/stellar/staking";
import { TxStatus, type TxState } from "./TxStatus";

interface StakingTabProps {
  address: string | null;
  walletBalance?: string | null;
}

export function StakingTab({ address, walletBalance }: StakingTabProps) {
  const {
    pools,
    stats,
    positions,
    pendingRewards,
    totalStakedUsd,
    totalUnclaimedRewards,
    totalClaimedRewards,
    loading,
    stake,
    unstake,
    claim,
    compound,
  } = useStaking(address);

  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [modalMode, setModalMode] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [selectedLockDays, setSelectedLockDays] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [txState, setTxState] = useState<TxState>({ kind: "idle" });

  const activeLockConfig = LOCK_PERIODS.find((l) => l.days === selectedLockDays) || LOCK_PERIODS[0];

  const filteredPools = pools.filter((p) => {
    if (categoryFilter === "all") return true;
    return p.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  const handleOpenModal = (pool: StakingPool, mode: "stake" | "unstake") => {
    setSelectedPool(pool);
    setModalMode(mode);
    setAmount("");
    setSelectedLockDays(0);
    setTxState({ kind: "idle" });
  };

  const handleExecute = async () => {
    if (!address || !selectedPool || !amount || Number(amount) <= 0) return;

    const numAmount = Number(amount);
    setTxState({ kind: "pending", label: `${modalMode === "stake" ? "Staking" : "Unstaking"} ${amount} ${selectedPool.stakeTokenSymbol}...` });

    try {
      if (modalMode === "stake") {
        const res = await stake(selectedPool.id, numAmount, selectedLockDays);
        setTxState({
          kind: "success",
          title: "Staked Successfully",
          lines: [
            `Amount: ${numAmount} ${selectedPool.stakeTokenSymbol}`,
            `Lock Duration: ${activeLockConfig.label} (${activeLockConfig.multiplier}x Boost)`,
          ],
          txHash: res.txHash,
        });
        toast.success(`Staked ${numAmount} ${selectedPool.stakeTokenSymbol}!`, {
          description: `Boost: ${activeLockConfig.multiplier}x · Generating real-time ORBIT emissions.`,
        });
      } else {
        const res = await unstake(selectedPool.id, numAmount);
        setTxState({
          kind: "success",
          title: "Unstaked Successfully",
          lines: [
            `Withdrawn: ${numAmount} ${selectedPool.stakeTokenSymbol}`,
            `Harvested: ${res.harvestedRewards.toFixed(4)} ORBIT`,
          ],
          txHash: res.txHash,
        });
        toast.success(`Unstaked ${numAmount} ${selectedPool.stakeTokenSymbol}!`, {
          description: `Harvested ${res.harvestedRewards.toFixed(4)} ORBIT rewards.`,
        });
      }
      setAmount("");
    } catch (err: any) {
      setTxState({
        kind: "error",
        title: "Transaction Failed",
        message: err.message || "Failed to execute staking transaction",
      });
      toast.error("Staking Error", { description: err.message });
    }
  };

  const handleClaimAll = async () => {
    if (!address) return;
    try {
      const res = await claim();
      toast.success(`Claimed ${res.totalClaimed.toFixed(4)} ORBIT!`, {
        description: "Rewards deposited directly to your wallet.",
      });
    } catch (err: any) {
      toast.error("Claim Error", { description: err.message });
    }
  };

  const handleCompoundAll = async () => {
    if (!address) return;
    try {
      const res = await compound("oxlm-liquid");
      toast.success(`Compounded ${res.compoundedAmount.toFixed(4)} ORBIT into oXLM Vault!`, {
        description: "Auto-compounding maximizes continuous APY yield.",
      });
    } catch (err: any) {
      toast.error("Compound Error", { description: err.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Protocol Telemetry Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:p-5 backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Staking TVL</span>
            <Flame className="h-3.5 w-3.5 text-[var(--orbit-warn)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            $${stats.totalTvlUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-ok)] flex items-center gap-1">
            <span className="live-dot" /> Live Soroban Emissions
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:p-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>ORBIT Price</span>
            <Coins className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-[var(--orbit-accent)]">
            $${stats.orbitPriceUsd.toFixed(2)}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">
            Governance & Yield Token
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:p-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Your Staked Value</span>
            <Lock className="h-3.5 w-3.5 text-[var(--orbit-ok)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            $${totalStakedUsd.toFixed(2)}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">
            Across {Object.keys(positions).length} Active Pool(s)
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/5 p-4 sm:p-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-accent)] mb-2">
            <span>Lifetime Claimed</span>
            <Sparkles className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {totalClaimedRewards.toFixed(2)} <span className="text-xs text-[var(--orbit-accent)] font-mono">ORBIT</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">
            ≈ $${(totalClaimedRewards * stats.orbitPriceUsd).toFixed(2)} USD
          </div>
        </motion.div>
      </div>

      {/* Global User Rewards Banner & Action Center */}
      <div className="rounded-3xl border border-[var(--orbit-edge)] bg-gradient-to-r from-black/80 via-[var(--orbit-accent)]/10 to-black/80 p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20 text-[var(--orbit-accent)]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--orbit-accent)] font-semibold">
                Live Harvest Telemetry
              </span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white flex items-baseline gap-2">
              {totalUnclaimedRewards.toFixed(4)} <span className="text-base text-[var(--orbit-accent)] font-mono">ORBIT</span>
              <span className="text-xs font-mono text-[var(--orbit-mute)] font-normal">
                (≈ $${(totalUnclaimedRewards * stats.orbitPriceUsd).toFixed(2)} USD)
              </span>
            </h3>
            <p className="text-xs font-mono text-[var(--orbit-mute)]">
              Accruing per-second on Stellar Soroban Testnet. Zero lock on earned emissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleClaimAll}
              disabled={totalUnclaimedRewards <= 0 || loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-[var(--orbit-accent)] px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer shadow-[0_0_20px_var(--orbit-accent-soft)]"
            >
              <Coins className="h-4 w-4" />
              Harvest All
            </button>
            <button
              onClick={handleCompoundAll}
              disabled={totalUnclaimedRewards <= 0 || loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-white/5 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Zap className="h-4 w-4 text-[var(--orbit-warn)]" />
              Auto-Compound (oXLM)
            </button>
          </div>
        </div>
      </div>

      {/* Pools Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-tight">Active Staking Farms</h2>
          <p className="font-mono text-xs text-[var(--orbit-mute)]">Stake LP tokens and vault receipts for maximum yield</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-1">
          {[
            { id: "all", label: "All Pools" },
            { id: "liquid", label: "Liquid Staking" },
            { id: "fixed", label: "Fixed Yield" },
            { id: "leveraged", label: "Leveraged" },
            { id: "dex", label: "DEX LP" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                categoryFilter === cat.id
                  ? "bg-[var(--orbit-accent)] text-black font-semibold"
                  : "text-[var(--orbit-mute)] hover:text-white hover:bg-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staking Pools Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredPools.map((pool) => {
          const userPos = positions[pool.id];
          const userStaked = userPos?.stakedAmount || 0;
          const userRewards = pendingRewards[pool.id] || 0;
          const maxApr = (pool.baseApr * 4.0).toFixed(1);

          return (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[var(--orbit-edge)] bg-black/40 p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group hover:border-[var(--orbit-accent)]/50 transition-all duration-300 shadow-lg"
            >
              {pool.isPopular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-[var(--orbit-accent)] text-black font-mono text-[9px] uppercase font-bold px-3 py-1 rounded-bl-xl tracking-wider">
                    High APY
                  </div>
                </div>
              )}

              <div>
                {/* Pool Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--orbit-edge)] bg-white/5 font-mono text-sm font-bold text-[var(--orbit-accent)]">
                    {pool.stakeTokenSymbol.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{pool.name}</h3>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--orbit-mute)]">
                      <span className="rounded-full bg-white/5 px-2 py-0.5">{pool.category}</span>
                      <span>•</span>
                      <span>Earns {pool.rewardTokenSymbol}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[var(--orbit-mute)] leading-relaxed mb-5 min-h-[36px]">
                  {pool.description}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mb-5 rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
                  <div className="text-center">
                    <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-0.5">Base APR</div>
                    <div className="font-display text-sm font-bold text-[var(--orbit-ok)]">{pool.baseApr}%</div>
                  </div>
                  <div className="text-center border-x border-[var(--orbit-edge)]">
                    <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-0.5">Max Boost APR</div>
                    <div className="font-display text-sm font-bold text-[var(--orbit-warn)]">{maxApr}%</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-0.5">Pool TVL</div>
                    <div className="font-display text-sm font-bold text-white">${pool.tvlUsd.toLocaleString()}</div>
                  </div>
                </div>

                {/* User Staked Position Breakdown */}
                {userStaked > 0 && (
                  <div className="rounded-2xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/5 p-4 mb-5 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[var(--orbit-mute)]">
                      <span>Your Staked Balance</span>
                      <span className="font-bold text-white">
                        {userStaked.toFixed(2)} {pool.stakeTokenSymbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--orbit-mute)]">
                      <span>Lock Multiplier</span>
                      <span className="font-bold text-[var(--orbit-accent)]">
                        {userPos?.lockMultiplier}x ({userPos?.lockDays === 0 ? "Flexible" : `${userPos?.lockDays} Days`})
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--orbit-edge)]">
                      <span className="text-[var(--orbit-mute)] flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-[var(--orbit-accent)]" /> Unclaimed Rewards
                      </span>
                      <span className="font-bold text-[var(--orbit-ok)] animate-pulse">
                        +{userRewards.toFixed(4)} ORBIT
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleOpenModal(pool, "stake")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--orbit-ink)] text-black py-3 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white active:scale-98 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" /> Stake
                </button>
                {userStaked > 0 && (
                  <button
                    onClick={() => handleOpenModal(pool, "unstake")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-white/5 text-white py-3 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10 active:scale-98 cursor-pointer"
                  >
                    <Unlock className="h-3.5 w-3.5" /> Unstake
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stake / Unstake Modal */}
      <AnimatePresence>
        {selectedPool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-[var(--orbit-edge)] bg-[#0a0a0a] p-6 max-w-lg w-full relative shadow-2xl space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {modalMode === "stake" ? "Stake in" : "Unstake from"} {selectedPool.name}
                  </h3>
                  <p className="font-mono text-xs text-[var(--orbit-mute)]">
                    {modalMode === "stake"
                      ? "Lock tokens to farm boosted ORBIT emissions"
                      : "Withdraw your staked tokens and claim rewards"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPool(null)}
                  className="rounded-xl border border-[var(--orbit-edge)] bg-white/5 p-2 text-[var(--orbit-mute)] hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2 font-mono text-xs">
                  <span className="text-[var(--orbit-mute)]">Amount to {modalMode}</span>
                  <span className="text-white">
                    Available: {modalMode === "stake" ? (walletBalance ? Number(walletBalance).toFixed(2) : "1,000.00") : (positions[selectedPool.id]?.stakedAmount || 0).toFixed(2)} {selectedPool.stakeTokenSymbol}
                  </span>
                </div>

                <div className="relative rounded-2xl border border-[var(--orbit-edge)] bg-black/60 p-3 focus-within:border-[var(--orbit-accent)]">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent font-mono text-2xl font-bold text-white outline-none placeholder:text-[var(--orbit-mute)]/40"
                  />
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--orbit-edge)]">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const max = modalMode === "stake" ? (walletBalance ? Number(walletBalance) : 1000) : (positions[selectedPool.id]?.stakedAmount || 0);
                          setAmount(((max * pct) / 100).toFixed(2));
                        }}
                        className="rounded-lg border border-[var(--orbit-edge)] bg-white/5 px-2.5 py-1 font-mono text-[10px] text-[var(--orbit-mute)] hover:text-white hover:bg-white/10"
                      >
                        {pct === 100 ? "MAX" : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lock Duration Selector (Only for Staking) */}
              {modalMode === "stake" && (
                <div>
                  <label className="block font-mono text-xs text-[var(--orbit-mute)] mb-2">
                    Lock Period & Yield Multiplier
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LOCK_PERIODS.map((lock) => {
                      const isSelected = selectedLockDays === lock.days;
                      return (
                        <button
                          key={lock.days}
                          type="button"
                          onClick={() => setSelectedLockDays(lock.days)}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            isSelected
                              ? "border-[var(--orbit-accent)] bg-[var(--orbit-accent)]/10 text-white"
                              : "border-[var(--orbit-edge)] bg-white/[0.02] text-[var(--orbit-mute)] hover:border-white/20"
                          }`}
                        >
                          <div className="font-display text-xs font-bold">{lock.label}</div>
                          <div className="font-mono text-[10px] text-[var(--orbit-accent)] font-semibold mt-1">
                            {lock.multiplier}x Boost
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Return Projection Summary */}
              {modalMode === "stake" && amount && Number(amount) > 0 && (
                <div className="rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4 font-mono text-xs space-y-2">
                  <div className="flex justify-between text-[var(--orbit-mute)]">
                    <span>Effective APR</span>
                    <span className="font-bold text-[var(--orbit-ok)]">
                      {(selectedPool.baseApr * activeLockConfig.multiplier).toFixed(2)}% APR
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--orbit-mute)]">
                    <span>Est. Monthly Rewards</span>
                    <span className="font-bold text-[var(--orbit-accent)]">
                      +{(Number(amount) * ((selectedPool.baseApr * activeLockConfig.multiplier) / 100 / 12)).toFixed(2)} ORBIT
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleExecute}
                disabled={!amount || Number(amount) <= 0 || loading}
                className="w-full rounded-2xl bg-[var(--orbit-accent)] py-4 font-display text-sm font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-98 disabled:opacity-40 cursor-pointer shadow-[0_0_30px_var(--orbit-accent-soft)]"
              >
                {loading ? "Processing On-Chain..." : `Confirm ${modalMode === "stake" ? "Stake" : "Unstake"}`}
              </button>

              {txState.kind !== "idle" && (
                <div className="pt-2">
                  <TxStatus state={txState} />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
