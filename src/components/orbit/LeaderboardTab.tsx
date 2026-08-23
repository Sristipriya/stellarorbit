import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Copy,
  Search,
  Zap,
  Flame,
  Globe,
  RefreshCcw,
  CheckCircle2,
  TrendingUp,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { type ActivityEvent } from "@/lib/stellar/events";
import { stroopsToXlm, shortAddr, NETWORK } from "@/lib/stellar/network";
import { supabase } from "@/lib/supabase";

export type GlobalLeaderEntry = {
  address: string;
  displayName: string | null;
  points: number;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  netPosition: bigint;
  txCount: number;
  tier: "Titan" | "Whale" | "Pioneer" | "Voyager" | "Cadet";
};

function getTier(points: number, depositedXlm: number): "Titan" | "Whale" | "Pioneer" | "Voyager" | "Cadet" {
  if (points >= 5000 || depositedXlm >= 50000) return "Titan";
  if (points >= 1500 || depositedXlm >= 10000) return "Whale";
  if (points >= 500 || depositedXlm >= 2000) return "Pioneer";
  if (points >= 100 || depositedXlm >= 500) return "Voyager";
  return "Cadet";
}

function tierBadge(tier: GlobalLeaderEntry["tier"]) {
  switch (tier) {
    case "Titan":
      return { label: "Orbit Titan", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
    case "Whale":
      return { label: "Yield Whale", color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" };
    case "Pioneer":
      return { label: "DeFi Pioneer", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" };
    case "Voyager":
      return { label: "Voyager", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" };
    default:
      return { label: "Cadet", color: "bg-white/5 text-[var(--orbit-mute)] border-white/10" };
  }
}

function rankBadge(rank: number) {
  if (rank === 1) return { emoji: "🥇", label: "#1", color: "text-amber-400", bg: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/40" };
  if (rank === 2) return { emoji: "🥈", label: "#2", color: "text-slate-300", bg: "from-slate-400/20 via-slate-400/5 to-transparent border-slate-400/40" };
  if (rank === 3) return { emoji: "🥉", label: "#3", color: "text-amber-600", bg: "from-amber-700/20 via-amber-700/5 to-transparent border-amber-700/40" };
  return { emoji: `#${rank}`, label: `#${rank}`, color: "text-[var(--orbit-mute)]", bg: "bg-black/40 border-[var(--orbit-edge)]" };
}

export function LeaderboardTab({
  events,
  currentAddress,
}: {
  events: ActivityEvent[];
  currentAddress: string | null;
}) {
  const [globalProfiles, setGlobalProfiles] = useState<Array<{ wallet_address: string; display_name: string | null; points: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"points" | "tvl" | "txs">("points");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  // Fetch all global user records from Supabase
  async function fetchGlobalUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("wallet_address, display_name, points")
        .order("points", { ascending: false })
        .limit(200);

      if (!error && data) {
        setGlobalProfiles(data.map(p => ({
          wallet_address: p.wallet_address,
          display_name: p.display_name,
          points: Number(p.points || 0),
        })));
      }
    } catch (err) {
      console.error("Failed to load global profiles:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGlobalUsers();
  }, []);

  // Merge Supabase Global Profiles with on-chain event activity
  const mergedLeaderboard = useMemo((): GlobalLeaderEntry[] => {
    const map = new Map<string, GlobalLeaderEntry>();

    // 1. Seed from Supabase Global Profiles
    for (const p of globalProfiles) {
      if (!p.wallet_address) continue;
      map.set(p.wallet_address, {
        address: p.wallet_address,
        displayName: p.display_name,
        points: p.points,
        totalDeposited: 0n,
        totalWithdrawn: 0n,
        netPosition: 0n,
        txCount: 0,
        tier: getTier(p.points, 0),
      });
    }

    // 2. Merge all on-chain deposit/withdraw events
    for (const ev of events || []) {
      if (!ev.address) continue;
      const existing = map.get(ev.address) ?? {
        address: ev.address,
        displayName: null,
        points: 0,
        totalDeposited: 0n,
        totalWithdrawn: 0n,
        netPosition: 0n,
        txCount: 0,
        tier: "Cadet",
      };

      if (ev.kind === "deposit") {
        existing.totalDeposited += BigInt(ev.amountStroops || 0n);
        existing.netPosition += BigInt(ev.amountStroops || 0n);
        // If no explicit points in DB, calculate 1 point per 10 XLM deposited
        if (existing.points === 0) {
          existing.points += Math.floor(Number(ev.amountStroops || 0n) / 100_000_000);
        }
      } else {
        existing.totalWithdrawn += BigInt(ev.amountStroops || 0n);
        existing.netPosition -= BigInt(ev.amountStroops || 0n);
      }
      existing.txCount += 1;
      const depXlm = Number(stroopsToXlm(existing.totalDeposited));
      existing.tier = getTier(existing.points, depXlm);
      map.set(ev.address, existing);
    }

    // 3. Add connected user if not present yet
    if (currentAddress && !map.has(currentAddress)) {
      map.set(currentAddress, {
        address: currentAddress,
        displayName: null,
        points: 0,
        totalDeposited: 0n,
        totalWithdrawn: 0n,
        netPosition: 0n,
        txCount: 0,
        tier: "Cadet",
      });
    }

    // Sort according to active filter
    const list = [...map.values()];
    if (filterType === "points") {
      list.sort((a, b) => b.points - a.points || (b.totalDeposited > a.totalDeposited ? 1 : -1));
    } else if (filterType === "tvl") {
      list.sort((a, b) => (b.totalDeposited > a.totalDeposited ? 1 : b.totalDeposited < a.totalDeposited ? -1 : 0));
    } else if (filterType === "txs") {
      list.sort((a, b) => b.txCount - a.txCount || b.points - a.points);
    }

    return list;
  }, [globalProfiles, events, filterType, currentAddress]);

  // Filtered by Search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return mergedLeaderboard;
    const q = searchQuery.toLowerCase().trim();
    return mergedLeaderboard.filter(
      (entry) =>
        entry.address.toLowerCase().includes(q) ||
        (entry.displayName && entry.displayName.toLowerCase().includes(q))
    );
  }, [mergedLeaderboard, searchQuery]);

  // Calculate connected user's rank
  const myRankIndex = mergedLeaderboard.findIndex((e) => e.address === currentAddress);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
  const myEntry = myRankIndex >= 0 ? mergedLeaderboard[myRankIndex] : null;
  const top10Percentile = mergedLeaderboard.length > 0 && myRank ? Math.max(1, Math.round((myRank / mergedLeaderboard.length) * 100)) : null;

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    toast.success("Wallet address copied!");
    setTimeout(() => setCopiedAddr(null), 2000);
  }

  return (
    <div className="space-y-6 text-[var(--orbit-ink)]">
      {/* Global Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--orbit-edge)] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--orbit-accent)]/15 text-[var(--orbit-accent)]">
              <Globe className="h-4 w-4" />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white">
              Global Orbit Leaderboard
            </h2>
            <span className="live-dot" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-ok)]">
              Live Network
            </span>
          </div>
          <p className="font-mono text-xs text-[var(--orbit-mute)]">
            Verified global rankings across all registered Stellar accounts & Soroban smart vault depositors
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchGlobalUsers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-black/40 px-3 py-2 font-mono text-xs text-[var(--orbit-mute)] hover:text-white hover:border-[var(--orbit-accent)]/40 transition-all cursor-pointer"
            title="Refresh global standings"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[var(--orbit-accent)]" : ""}`} />
            <span>{loading ? "Syncing..." : "Sync Global"}</span>
          </button>
        </div>
      </div>

      {/* Connected User Standing Banner */}
      {currentAddress && myEntry && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--orbit-accent)]/40 bg-gradient-to-r from-[var(--orbit-accent)]/10 via-black/40 to-transparent p-5 backdrop-blur-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--orbit-accent)]/20 border border-[var(--orbit-accent)]/30 font-display text-xl font-bold text-[var(--orbit-accent)] shadow-[0_0_20px_var(--orbit-accent-soft)]">
                #{myRank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-base">
                    {myEntry.displayName || shortAddr(currentAddress)}
                  </span>
                  <span className="rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/15 px-2 py-0.5 font-mono text-[9px] text-[var(--orbit-accent)] font-semibold">
                    Your Global Rank
                  </span>
                </div>
                <p className="font-mono text-xs text-[var(--orbit-mute)] mt-0.5">
                  {top10Percentile ? `Top ${top10Percentile}% of all protocol participants` : "Participating in Orbit yield vaults"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">Points (XP)</div>
                <div className="font-display text-base font-bold text-[var(--orbit-accent)] flex items-center gap-1 justify-end">
                  <Zap className="h-3.5 w-3.5 fill-[var(--orbit-accent)]" />
                  {myEntry.points.toLocaleString()}
                </div>
              </div>
              <div className="h-8 w-px bg-[var(--orbit-edge)]" />
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">Deposited</div>
                <div className="font-display text-base font-bold text-white">
                  {stroopsToXlm(myEntry.totalDeposited)} XLM
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top 3 Podium (Gold, Silver, Bronze) */}
      {filteredLeaderboard.length >= 3 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {filteredLeaderboard.slice(0, 3).map((entry, i) => {
            const { emoji, bg, color } = rankBadge(i + 1);
            const isMe = entry.address === currentAddress;
            const badge = tierBadge(entry.tier);

            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative overflow-hidden rounded-3xl border bg-gradient-to-b ${bg} p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{emoji}</span>
                    <span className={`font-display text-xl font-extrabold ${color}`}>
                      Rank #{i + 1}
                    </span>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-white truncate">
                      {entry.displayName || shortAddr(entry.address)}
                    </span>
                    {isMe && (
                      <span className="rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/20 px-2 py-0.2 font-mono text-[9px] text-[var(--orbit-accent)] font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--orbit-mute)] truncate">
                    {entry.address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-black/40 p-3.5 font-mono text-xs">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Points</div>
                    <div className="font-display text-sm font-bold text-[var(--orbit-accent)] mt-0.5 flex items-center gap-1">
                      <Zap className="h-3 w-3 fill-[var(--orbit-accent)]" />
                      {entry.points.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Deposited</div>
                    <div className="font-display text-sm font-bold text-white mt-0.5">
                      {stroopsToXlm(entry.totalDeposited)} XLM
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-2.5 backdrop-blur-xl">
        {/* Sort Filter Tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: "points", label: "Top Points (XP)", icon: Zap },
            { id: "tvl", label: "Highest TVL", icon: TrendingUp },
            { id: "txs", label: "Most Active", icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as typeof filterType)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[var(--orbit-accent)] text-black shadow-[0_0_15px_var(--orbit-accent-soft)]"
                    : "text-[var(--orbit-mute)] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-[var(--orbit-mute)]" />
          <input
            type="text"
            placeholder="Search address or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-[var(--orbit-edge)] bg-black/50 py-1.5 pl-8 pr-3 font-mono text-xs text-white placeholder:text-[var(--orbit-mute)]/50 focus:border-[var(--orbit-accent)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-3xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-display text-sm font-semibold tracking-wide text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--orbit-accent)]" />
            Global Participants ({filteredLeaderboard.length})
          </h3>
          <span className="font-mono text-[10px] text-[var(--orbit-mute)]">
            Showing all on-chain & registered protocol users
          </span>
        </div>

        {filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto h-10 w-10 text-[var(--orbit-mute)]/40 mb-3" />
            <div className="font-display text-base text-white">No participants found</div>
            <p className="font-mono text-xs text-[var(--orbit-mute)] mt-1">
              Connect your wallet or deposit into the vault to appear on the global board.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLeaderboard.map((entry, index) => {
              const rank = index + 1;
              const isMe = entry.address === currentAddress;
              const badge = tierBadge(entry.tier);

              return (
                <motion.div
                  key={entry.address}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
                    isMe
                      ? "border-[var(--orbit-accent)]/50 bg-[var(--orbit-accent)]/10 shadow-[0_0_25px_-5px_var(--orbit-accent-soft)]"
                      : "border-[var(--orbit-edge)] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Left: Rank & User Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 font-display text-sm font-bold text-white border border-white/10">
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-white truncate">
                          {entry.displayName || shortAddr(entry.address)}
                        </span>
                        {isMe && (
                          <span className="rounded-full border border-[var(--orbit-accent)]/40 bg-[var(--orbit-accent)]/20 px-2 py-0.5 font-mono text-[9px] text-[var(--orbit-accent)] font-semibold">
                            You
                          </span>
                        )}
                        <span className={`hidden sm:inline-block rounded-full border px-2 py-0.2 font-mono text-[8px] font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--orbit-mute)] mt-0.5">
                        <span className="truncate max-w-[140px] sm:max-w-[220px]">{entry.address}</span>
                        <span>·</span>
                        <span>{entry.txCount} txs</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0 font-mono">
                    <div className="text-left sm:text-right">
                      <div className="text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Points</div>
                      <div className="font-display text-sm font-bold text-[var(--orbit-accent)] flex items-center sm:justify-end gap-1">
                        <Zap className="h-3 w-3 fill-[var(--orbit-accent)]" />
                        {entry.points.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Deposited</div>
                      <div className="font-display text-sm font-bold text-white">
                        {stroopsToXlm(entry.totalDeposited)} XLM
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => copyAddress(entry.address)}
                        className="rounded-lg border border-[var(--orbit-edge)] bg-white/5 p-1.5 text-[var(--orbit-mute)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy wallet address"
                      >
                        {copiedAddr === entry.address ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--orbit-ok)]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {!isMe && (
                        <button
                          onClick={() => toast.success(`Mirroring strategy of ${entry.displayName || shortAddr(entry.address)}`)}
                          className="rounded-lg border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--orbit-accent)] hover:bg-[var(--orbit-accent)]/20 transition-all cursor-pointer"
                          title="Copy this user's vault allocation"
                        >
                          Mirror
                        </button>
                      )}

                      <a
                        href={NETWORK.explorerAccount(entry.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-[var(--orbit-edge)] bg-white/5 p-1.5 text-[var(--orbit-mute)] hover:text-[var(--orbit-accent)] hover:bg-white/10 transition-colors"
                        title="View account on Stellar Expert"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
