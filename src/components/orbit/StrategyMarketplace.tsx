import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Vote,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Layers,
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/use-wallet";
import {
  getStoredStrategies,
  getUserStrategyPositions,
  depositToStrategy,
  withdrawFromStrategy,
  voteForStrategy,
  proposeNewStrategy,
  type YieldStrategy,
  type UserStrategyPosition
} from "@/lib/stellar/strategies";

export function StrategyMarketplace() {
  const { address, balance } = useWallet();
  const [strategies, setStrategies] = useState<YieldStrategy[]>([]);
  const [positions, setPositions] = useState<Record<string, UserStrategyPosition>>({});
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "proposed" | "my">("all");
  
  // Modals state
  const [depositStrat, setDepositStrat] = useState<YieldStrategy | null>(null);
  const [withdrawStrat, setWithdrawStrat] = useState<YieldStrategy | null>(null);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Proposal form state
  const [propName, setPropName] = useState("");
  const [propAuthor, setPropAuthor] = useState("");
  const [propDesc, setPropDesc] = useState("");
  const [propApy, setPropApy] = useState("18.5");
  const [propRisk, setPropRisk] = useState<"Low" | "Medium" | "High">("Medium");
  const [propProtocols, setPropProtocols] = useState("Blend, Soroswap");

  const loadData = () => {
    const list = getStoredStrategies();
    setStrategies(list);
    if (address) {
      const userPos = getUserStrategyPositions(address);
      setPositions(userPos);
    }
  };

  useEffect(() => {
    loadData();
  }, [address]);

  const handleVote = async (strat: YieldStrategy) => {
    try {
      const updated = await voteForStrategy(strat.id, 250);
      toast.success(`Voted +250 Points for ${strat.name}!`, {
        description: updated.status === "active" ? "Strategy reached quorum and is now LIVE!" : "Votes added to DAO quorum.",
      });
      loadData();
    } catch (err: any) {
      toast.error("Voting failed", { description: err.message });
    }
  };

  const handleDeposit = async () => {
    if (!address || !depositStrat || !depositAmount || Number(depositAmount) <= 0) return;
    setLoading(true);
    try {
      await depositToStrategy(address, depositStrat.id, Number(depositAmount));
      toast.success(`Deposited ${depositAmount} XLM into ${depositStrat.name}!`, {
        description: "Automated rebalancing active. Yield accrues continuously.",
      });
      setDepositStrat(null);
      setDepositAmount("");
      loadData();
    } catch (err: any) {
      toast.error("Deposit failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawStrat || !withdrawAmount || Number(withdrawAmount) <= 0) return;
    setLoading(true);
    try {
      await withdrawFromStrategy(address, withdrawStrat.id, Number(withdrawAmount));
      toast.success(`Withdrawn ${withdrawAmount} XLM from ${withdrawStrat.name}!`);
      setWithdrawStrat(null);
      setWithdrawAmount("");
      loadData();
    } catch (err: any) {
      toast.error("Withdrawal failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName || !propDesc || !propApy) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const protocolsArray = propProtocols.split(",").map((p) => p.trim()).filter(Boolean);
      await proposeNewStrategy(
        propAuthor || "Community Strategist",
        propName,
        propDesc,
        Number(propApy),
        propRisk,
        protocolsArray
      );
      toast.success(`Strategy "${propName}" proposed successfully!`, {
        description: "Community members can now vote with Orbit Points to deploy it.",
      });
      setProposeModalOpen(false);
      setPropName("");
      setPropDesc("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to propose strategy", { description: err.message });
    }
  };

  // Metrics
  const totalDeployedUsd = strategies.reduce((sum, s) => sum + s.tvlUsd, 0);
  const totalVotesCast = strategies.reduce((sum, s) => sum + s.votes, 0);
  const userTotalStrategyXlm = Object.values(positions).reduce((sum, p) => sum + p.depositedAmount, 0);

  const filteredStrategies = strategies.filter((s) => {
    if (activeFilter === "active") return s.status === "active";
    if (activeFilter === "proposed") return s.status === "proposed";
    if (activeFilter === "my") return (positions[s.id]?.depositedAmount || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header & DAO Action Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20 text-[var(--orbit-accent)]">
              <Layers className="h-3.5 w-3.5" />
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--orbit-accent)] font-semibold">
              Orbit DAO Automated Vaults
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white mt-1">
            Strategy Marketplace
          </h1>
          <p className="mt-1 text-sm text-[var(--orbit-mute)] max-w-xl">
            Deploy capital into automated yield strategies or propose new auto-compounding algorithms.
          </p>
        </div>

        <button
          onClick={() => setProposeModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--orbit-accent)] px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-[0_0_20px_var(--orbit-accent-soft)]"
        >
          <PlusCircle className="h-4 w-4" />
          Propose Strategy
        </button>
      </div>

      {/* Protocol Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Total Value Deployed</span>
            <Coins className="h-3.5 w-3.5 text-[var(--orbit-ok)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            $${totalDeployedUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-ok)]">
            Across {strategies.filter((s) => s.status === "active").length} Live Vaults
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Your Deployed Capital</span>
            <Lock className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-[var(--orbit-accent)]">
            {userTotalStrategyXlm.toFixed(2)} <span className="text-xs font-mono">XLM</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">
            ≈ $${(userTotalStrategyXlm * 0.12).toFixed(2)} USD
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>DAO Votes Cast</span>
            <Vote className="h-3.5 w-3.5 text-[var(--orbit-warn)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {totalVotesCast.toLocaleString()} <span className="text-xs font-mono text-[var(--orbit-mute)]">pts</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">
            Orbit Points Governance
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Community Proposals</span>
            <Users className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {strategies.filter((s) => s.status === "proposed").length} <span className="text-xs font-mono text-[var(--orbit-mute)]">Pending</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-accent)]">
            5,000 Points Quorum
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-1">
          {[
            { id: "all", label: "All Strategies" },
            { id: "active", label: "Live Auto-Vaults" },
            { id: "proposed", label: "Community Proposals" },
            { id: "my", label: `My Positions (${Object.keys(positions).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? "bg-[var(--orbit-accent)] text-black font-semibold"
                  : "text-[var(--orbit-mute)] hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStrategies.map((strat, i) => {
          const userPos = positions[strat.id];
          const userDeposited = userPos?.depositedAmount || 0;
          const voteProgress = Math.min(100, Math.round((strat.votes / strat.targetVotes) * 100));

          return (
            <motion.div
              key={strat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl border border-[var(--orbit-edge)] bg-black/40 p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group hover:border-[var(--orbit-accent)]/50 transition-all duration-300 shadow-lg"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-3">
                {strat.status === "active" ? (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--orbit-ok)]/15 border border-[var(--orbit-ok)]/30 px-2.5 py-0.5 text-[10px] uppercase font-bold text-[var(--orbit-ok)]">
                    <ShieldCheck className="h-3 w-3" /> Live Vault
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--orbit-warn)]/15 border border-[var(--orbit-warn)]/30 px-2.5 py-0.5 text-[10px] uppercase font-bold text-[var(--orbit-warn)]">
                    <Clock className="h-3 w-3" /> Voting Phase
                  </span>
                )}

                {strat.isOfficial && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--orbit-accent)] bg-[var(--orbit-accent)]/10 px-2 py-0.5 rounded-full">
                    Official
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white leading-tight mb-1">
                  {strat.name}
                </h3>
                <div className="font-mono text-xs text-[var(--orbit-accent)] mb-3">
                  by {strat.author}
                </div>

                <p className="text-xs text-[var(--orbit-mute)] leading-relaxed mb-4 line-clamp-3 min-h-[48px]">
                  {strat.description}
                </p>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4 rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.02] p-2.5 text-center font-mono">
                  <div>
                    <div className="text-[9px] uppercase text-[var(--orbit-mute)] mb-0.5">Target APY</div>
                    <div className="font-display text-sm font-bold text-[var(--orbit-warn)]">{strat.apy}%</div>
                  </div>
                  <div className="border-x border-[var(--orbit-edge)]">
                    <div className="text-[9px] uppercase text-[var(--orbit-mute)] mb-0.5">Risk</div>
                    <div className={`text-xs font-bold ${
                      strat.risk === "Low" ? "text-[var(--orbit-ok)]" : strat.risk === "Medium" ? "text-[var(--orbit-warn)]" : "text-[var(--orbit-danger)]"
                    }`}>
                      {strat.risk}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase text-[var(--orbit-mute)] mb-0.5">Vault TVL</div>
                    <div className="text-xs font-bold text-white">$${strat.tvlUsd.toLocaleString()}</div>
                  </div>
                </div>

                {/* Protocols Tagline */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {strat.protocols.map((proto) => (
                    <span key={proto} className="rounded-lg bg-white/5 px-2 py-0.5 font-mono text-[9px] text-[var(--orbit-mute)]">
                      {proto}
                    </span>
                  ))}
                  <span className="ml-auto font-mono text-[9px] text-[var(--orbit-mute)]">
                    {strat.executionFrequency}
                  </span>
                </div>

                {/* Proposed Strategy Quorum Progress */}
                {strat.status === "proposed" && (
                  <div className="mb-4 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-[10px] text-[var(--orbit-mute)]">
                      <span>DAO Quorum ({voteProgress}%)</span>
                      <span>{strat.votes.toLocaleString()} / {strat.targetVotes.toLocaleString()} pts</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[var(--orbit-accent)] rounded-full transition-all duration-500"
                        style={{ width: `${voteProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* User Active Position Info */}
                {userDeposited > 0 && (
                  <div className="rounded-xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/5 p-3 mb-4 font-mono text-xs flex items-center justify-between">
                    <span className="text-[var(--orbit-mute)]">Your Active Capital</span>
                    <span className="font-bold text-[var(--orbit-accent)]">
                      {userDeposited.toFixed(2)} XLM
                    </span>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="pt-2">
                {strat.status === "active" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setDepositStrat(strat);
                        setDepositAmount("");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--orbit-ink)] text-black py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white active:scale-98 cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" /> Deposit
                    </button>
                    {userDeposited > 0 && (
                      <button
                        onClick={() => {
                          setWithdrawStrat(strat);
                          setWithdrawAmount("");
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-white/5 text-white py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10 active:scale-98 cursor-pointer"
                      >
                        <Unlock className="h-3.5 w-3.5" /> Withdraw
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleVote(strat)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] py-2.5 font-mono text-xs font-semibold text-[var(--orbit-accent)] transition-colors hover:bg-[var(--orbit-accent)]/20 hover:border-[var(--orbit-accent)] cursor-pointer"
                  >
                    <Vote className="h-3.5 w-3.5" />
                    Upvote (+250 Points)
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {depositStrat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-[var(--orbit-edge)] bg-[#0a0a0a] p-6 max-w-md w-full relative shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Deposit to Strategy</h3>
                  <p className="font-mono text-xs text-[var(--orbit-mute)]">{depositStrat.name}</p>
                </div>
                <button
                  onClick={() => setDepositStrat(null)}
                  className="rounded-xl border border-[var(--orbit-edge)] bg-white/5 p-2 text-[var(--orbit-mute)] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-[var(--orbit-mute)]">Deposit Amount (XLM)</span>
                  <span className="text-white">
                    Available: {balance ? Number(balance.xlm).toFixed(2) : "0.00"} XLM
                  </span>
                </div>
                <div className="relative rounded-2xl border border-[var(--orbit-edge)] bg-black/60 p-3 focus-within:border-[var(--orbit-accent)]">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent font-mono text-2xl font-bold text-white outline-none"
                  />
                  <button
                    onClick={() => balance && setDepositAmount(Math.max(0, Number(balance.xlm) - 1).toFixed(2))}
                    className="absolute right-3 top-3.5 rounded-lg border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-2.5 py-1 font-mono text-[10px] text-[var(--orbit-accent)]"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4 font-mono text-xs space-y-2">
                <div className="flex justify-between text-[var(--orbit-mute)]">
                  <span>Strategy Target APY</span>
                  <span className="font-bold text-[var(--orbit-warn)]">{depositStrat.apy}%</span>
                </div>
                <div className="flex justify-between text-[var(--orbit-mute)]">
                  <span>Execution Cadence</span>
                  <span className="text-white">{depositStrat.executionFrequency}</span>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={!depositAmount || Number(depositAmount) <= 0 || loading}
                className="w-full rounded-2xl bg-[var(--orbit-accent)] py-4 font-display text-sm font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-98 disabled:opacity-40 cursor-pointer shadow-[0_0_30px_var(--orbit-accent-soft)]"
              >
                {loading ? "Executing Strategy Deposit..." : "Confirm Deposit"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {withdrawStrat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-[var(--orbit-edge)] bg-[#0a0a0a] p-6 max-w-md w-full relative shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Withdraw Capital</h3>
                  <p className="font-mono text-xs text-[var(--orbit-mute)]">{withdrawStrat.name}</p>
                </div>
                <button
                  onClick={() => setWithdrawStrat(null)}
                  className="rounded-xl border border-[var(--orbit-edge)] bg-white/5 p-2 text-[var(--orbit-mute)] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-[var(--orbit-mute)]">Withdraw Amount (XLM)</span>
                  <span className="text-white">
                    Deposited: {(positions[withdrawStrat.id]?.depositedAmount || 0).toFixed(2)} XLM
                  </span>
                </div>
                <div className="relative rounded-2xl border border-[var(--orbit-edge)] bg-black/60 p-3 focus-within:border-[var(--orbit-accent)]">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent font-mono text-2xl font-bold text-white outline-none"
                  />
                  <button
                    onClick={() => setWithdrawAmount((positions[withdrawStrat.id]?.depositedAmount || 0).toFixed(2))}
                    className="absolute right-3 top-3.5 rounded-lg border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-2.5 py-1 font-mono text-[10px] text-[var(--orbit-accent)]"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || loading}
                className="w-full rounded-2xl bg-[var(--orbit-ink)] text-black py-4 font-display text-sm font-bold uppercase tracking-wider transition-all hover:bg-white active:scale-98 disabled:opacity-40 cursor-pointer"
              >
                {loading ? "Withdrawing..." : "Confirm Withdrawal"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Propose Strategy DAO Modal */}
      <AnimatePresence>
        {proposeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-[var(--orbit-edge)] bg-[#0a0a0a] p-6 max-w-lg w-full relative shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Propose Community Strategy</h3>
                  <p className="font-mono text-xs text-[var(--orbit-mute)]">Submit to Orbit DAO for community point voting</p>
                </div>
                <button
                  onClick={() => setProposeModalOpen(false)}
                  className="rounded-xl border border-[var(--orbit-edge)] bg-white/5 p-2 text-[var(--orbit-mute)] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePropose} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[var(--orbit-mute)] mb-1">Strategy Name *</label>
                  <input
                    type="text"
                    required
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    placeholder="e.g. XLM/EURC Delta Neutral Yield"
                    className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-3 text-white outline-none focus:border-[var(--orbit-accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--orbit-mute)] mb-1">Author / Handle</label>
                    <input
                      type="text"
                      value={propAuthor}
                      onChange={(e) => setPropAuthor(e.target.value)}
                      placeholder="e.g. YieldChad"
                      className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-3 text-white outline-none focus:border-[var(--orbit-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--orbit-mute)] mb-1">Target APY (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={propApy}
                      onChange={(e) => setPropApy(e.target.value)}
                      className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-3 text-white outline-none focus:border-[var(--orbit-accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--orbit-mute)] mb-1">Risk Profile</label>
                    <select
                      value={propRisk}
                      onChange={(e) => setPropRisk(e.target.value as any)}
                      className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-3 text-white outline-none focus:border-[var(--orbit-accent)]"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[var(--orbit-mute)] mb-1">Target Protocols</label>
                    <input
                      type="text"
                      value={propProtocols}
                      onChange={(e) => setPropProtocols(e.target.value)}
                      placeholder="Blend, Soroswap, Phoenix"
                      className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-3 text-white outline-none focus:border-[var(--orbit-accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--orbit-mute)] mb-1">Strategy Description & Mechanics *</label>
                  <textarea
                    required
                    rows={3}
                    value={propDesc}
                    onChange={(e) => setPropDesc(e.target.value)}
                    placeholder="Describe how the strategy harvests, rebalances, and generates yield on Soroban..."
                    className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-3 text-white outline-none focus:border-[var(--orbit-accent)] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[var(--orbit-accent)] py-4 font-display text-sm font-bold uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-98 cursor-pointer shadow-[0_0_30px_var(--orbit-accent-soft)] mt-2"
                >
                  Submit Proposal to DAO
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
