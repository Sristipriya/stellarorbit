import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, Zap, Vote, ExternalLink, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const MOCK_STRATEGIES = [
  {
    id: "strat_1",
    name: "Auto-Compound Soroswap LP",
    author: "DeFi Ninja",
    description: "Automatically harvests AQUA rewards from XLM/USDC pools and reinvests.",
    apy: "14.2%",
    risk: "Low",
    tvl: "$12.4K",
    status: "active",
    votes: 4200,
  },
  {
    id: "strat_2",
    name: "Delta-Neutral Funding Rate",
    author: "Yield Maximizer",
    description: "Hedges spot XLM exposure using perpetual futures to collect funding rates.",
    apy: "22.5%",
    risk: "Medium",
    tvl: "$0",
    status: "proposed",
    votes: 1850,
  },
  {
    id: "strat_3",
    name: "Phoenix Orderbook Market Making",
    author: "Algo Chad",
    description: "Provides liquidity to tightly spread pairs on Phoenix to capture bid/ask spreads.",
    apy: "31.0%",
    risk: "High",
    tvl: "$0",
    status: "proposed",
    votes: 890,
  },
];

export function StrategyMarketplace() {
  const [strategies, setStrategies] = useState(MOCK_STRATEGIES);

  const handleVote = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          toast.success(`Voted for ${s.name}!`);
          return { ...s, votes: s.votes + 100 }; // mock 100 points per vote
        }
        return s;
      })
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--orbit-ink)]">
            Strategies Marketplace
          </h1>
          <p className="mt-2 text-sm text-[var(--orbit-mute)]">
            Orbit DAO lets third-party strategists propose yield strategies. Vote with your Orbit Points to deploy new vaults.
          </p>
        </div>
        <button
          onClick={() => toast.info("Coming soon for approved DAO members.")}
          className="liquid-btn bg-[var(--orbit-accent)]/10 text-[var(--orbit-accent)] border-[var(--orbit-accent)]"
        >
          Propose Strategy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {strategies.map((strat, i) => (
          <motion.div
            key={strat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 relative overflow-hidden group"
          >
            {strat.status === "active" && (
              <div className="absolute top-0 right-0 p-3">
                <span className="flex items-center gap-1 rounded-full bg-[var(--orbit-ok)]/20 px-2 py-0.5 text-[10px] uppercase font-bold text-[var(--orbit-ok)]">
                  <ShieldCheck className="h-3 w-3" /> Live
                </span>
              </div>
            )}
            
            <h3 className="font-display text-lg font-bold pr-16 leading-tight">{strat.name}</h3>
            <div className="font-mono text-xs text-[var(--orbit-accent)] mb-3 mt-1">
              by {strat.author}
            </div>
            
            <p className="text-sm text-[var(--orbit-mute)] line-clamp-2 h-10 mb-4">
              {strat.description}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="rounded-lg bg-black/20 p-2 text-center border border-[var(--orbit-edge)]">
                <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-1">Target APY</div>
                <div className="font-display text-sm font-semibold text-[var(--orbit-warn)]">{strat.apy}</div>
              </div>
              <div className="rounded-lg bg-black/20 p-2 text-center border border-[var(--orbit-edge)]">
                <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-1">Risk</div>
                <div className="font-display text-sm font-semibold">{strat.risk}</div>
              </div>
              <div className="rounded-lg bg-black/20 p-2 text-center border border-[var(--orbit-edge)]">
                <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-1">TVL</div>
                <div className="font-display text-sm font-semibold">{strat.tvl}</div>
              </div>
            </div>

            {strat.status === "proposed" ? (
              <button
                onClick={() => handleVote(strat.id)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] py-2.5 text-sm transition-colors hover:bg-[var(--orbit-accent)]/20 hover:text-[var(--orbit-accent)] hover:border-[var(--orbit-accent)]"
              >
                <Vote className="h-4 w-4" />
                Vote ({strat.votes.toLocaleString()} pts)
              </button>
            ) : (
              <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--orbit-ink)] text-black py-2.5 text-sm font-bold transition-transform hover:scale-[1.02]">
                Deposit to Strategy <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
