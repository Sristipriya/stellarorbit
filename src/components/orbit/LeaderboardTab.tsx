import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Copy,
  Search,
  Globe,
  RefreshCw,
  Check,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Shield
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
};

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
        setGlobalProfiles(
          data.map((p) => ({
            wallet_address: p.wallet_address,
            display_name: p.display_name,
            points: Number(p.points || 0),
          }))
        );
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
      };

      if (ev.kind === "deposit") {
        existing.totalDeposited += BigInt(ev.amountStroops || 0n);
        existing.netPosition += BigInt(ev.amountStroops || 0n);
        if (existing.points === 0) {
          existing.points += Math.floor(Number(ev.amountStroops || 0n) / 100_000_000);
        }
      } else {
        existing.totalWithdrawn += BigInt(ev.amountStroops || 0n);
        existing.netPosition -= BigInt(ev.amountStroops || 0n);
      }
      existing.txCount += 1;
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

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopiedAddr(null), 2000);
  }

  return (
    <div className="space-y-6 text-[var(--orbit-ink)]">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--orbit-edge)] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Global Leaderboard
            </h2>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              Testnet
            </span>
          </div>
          <p className="font-mono text-xs text-[var(--orbit-mute)]">
            Institutional rankings across all registered accounts and on-chain vault depositors
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchGlobalUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/40 px-3.5 py-2 font-mono text-xs text-[var(--orbit-mute)] hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[var(--orbit-accent)]" : ""}`} />
            <span>{loading ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Connected User Overview Card */}
      {currentAddress && myEntry && (
        <div className="rounded-2xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/[0.04] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 font-mono text-lg font-bold text-[var(--orbit-accent)]">
                {myRank ? String(myRank).padStart(2, "0") : "--"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-white">
                    {myEntry.displayName || shortAddr(currentAddress)}
                  </span>
                  <span className="rounded border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--orbit-accent)]">
                    Your Account
                  </span>
                </div>
                <div className="font-mono text-xs text-[var(--orbit-mute)] mt-0.5 truncate max-w-xs sm:max-w-md">
                  {currentAddress}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 font-mono text-xs border-t border-white/5 pt-3 sm:border-t-0 sm:pt-0">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">Points (XP)</div>
                <div className="font-display text-base font-bold text-[var(--orbit-accent)] mt-0.5">
                  {myEntry.points.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">Total Deposited</div>
                <div className="font-display text-base font-bold text-white mt-0.5">
                  {stroopsToXlm(myEntry.totalDeposited)} XLM
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Summary Cards */}
      {filteredLeaderboard.length >= 3 && (
        <div className="grid gap-4 sm:grid-cols-3 font-mono">
          {filteredLeaderboard.slice(0, 3).map((entry, i) => {
            const isMe = entry.address === currentAddress;
            const rankLabel = String(i + 1).padStart(2, "0");

            return (
              <div
                key={entry.address}
                className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
                  i === 0
                    ? "border-[var(--orbit-accent)]/40 bg-black/60 shadow-[0_0_30px_-10px_var(--orbit-accent-soft)]"
                    : "border-[var(--orbit-edge)] bg-black/40"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-bold text-white">
                    RANK {rankLabel}
                  </span>
                  {isMe && (
                    <span className="rounded border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--orbit-accent)]">
                      You
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-4">
                  <div className="font-display text-base font-bold text-white truncate">
                    {entry.displayName || shortAddr(entry.address)}
                  </div>
                  <div className="text-[10px] text-[var(--orbit-mute)] truncate">
                    {entry.address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Points</div>
                    <div className="font-display text-sm font-bold text-[var(--orbit-accent)] mt-0.5">
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
              </div>
            );
          })}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-2.5 backdrop-blur-xl">
        {/* Sort Filter Tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: "points", label: "Points (XP)" },
            { id: "tvl", label: "Total Deposited" },
            { id: "txs", label: "Activity Count" },
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as typeof filterType)}
                className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[var(--orbit-accent)] text-black"
                    : "text-[var(--orbit-mute)] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
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

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 border-b border-[var(--orbit-edge)] bg-white/[0.02] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5 sm:col-span-4">Participant</div>
          <div className="col-span-3 sm:col-span-3 text-right">Points (XP)</div>
          <div className="hidden sm:block sm:col-span-2 text-right">Deposited</div>
          <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
        </div>

        {/* Table Body */}
        {filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center font-mono">
            <div className="text-sm text-[var(--orbit-mute)]">No participants found</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--orbit-edge)]">
            {filteredLeaderboard.map((entry, index) => {
              const rank = index + 1;
              const isMe = entry.address === currentAddress;
              const rankLabel = String(rank).padStart(2, "0");

              return (
                <div
                  key={entry.address}
                  className={`grid grid-cols-12 gap-4 items-center px-5 py-3.5 transition-colors font-mono text-xs ${
                    isMe
                      ? "bg-[var(--orbit-accent)]/[0.06]"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    <span
                      className={`font-mono text-xs font-bold ${
                        rank === 1
                          ? "text-[var(--orbit-accent)]"
                          : rank <= 3
                          ? "text-white"
                          : "text-[var(--orbit-mute)]"
                      }`}
                    >
                      {rankLabel}
                    </span>
                  </div>

                  {/* Participant */}
                  <div className="col-span-5 sm:col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs font-bold text-white truncate">
                        {entry.displayName || shortAddr(entry.address)}
                      </span>
                      {isMe && (
                        <span className="rounded border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-1 py-0.2 text-[8px] uppercase tracking-wider text-[var(--orbit-accent)]">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--orbit-mute)] truncate mt-0.5">
                      {entry.address}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="col-span-3 sm:col-span-3 text-right">
                    <div className="font-bold text-[var(--orbit-accent)]">
                      {entry.points.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-[var(--orbit-mute)]">
                      {entry.txCount} transactions
                    </div>
                  </div>

                  {/* Deposited */}
                  <div className="hidden sm:block sm:col-span-2 text-right">
                    <div className="font-bold text-white">
                      {stroopsToXlm(entry.totalDeposited)}
                    </div>
                    <div className="text-[9px] text-[var(--orbit-mute)]">XLM</div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => copyAddress(entry.address)}
                      className="rounded-lg border border-[var(--orbit-edge)] bg-white/5 p-1.5 text-[var(--orbit-mute)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      {copiedAddr === entry.address ? (
                        <Check className="h-3 w-3 text-[var(--orbit-ok)]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>

                    {!isMe && (
                      <button
                        onClick={() => toast.success(`Mirroring strategy of ${entry.displayName || shortAddr(entry.address)}`)}
                        className="rounded-lg border border-[var(--orbit-edge)] bg-white/5 px-2 py-1 text-[10px] text-[var(--orbit-mute)] hover:text-[var(--orbit-accent)] hover:border-[var(--orbit-accent)]/40 transition-colors cursor-pointer"
                        title="Mirror Strategy"
                      >
                        Mirror
                      </button>
                    )}

                    <a
                      href={NETWORK.explorerAccount(entry.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-[var(--orbit-edge)] bg-white/5 p-1.5 text-[var(--orbit-mute)] hover:text-[var(--orbit-accent)] hover:bg-white/10 transition-colors"
                      title="View on Explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

