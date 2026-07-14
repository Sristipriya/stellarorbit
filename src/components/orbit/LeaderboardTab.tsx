import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowDownToLine, ArrowUpFromLine, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { type ActivityEvent } from "@/lib/stellar/events";
import { stroopsToXlm, shortAddr, NETWORK } from "@/lib/stellar/network";

type LeaderEntry = {
  address: string;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  netPosition: bigint;
  txCount: number;
};

function rankBadge(rank: number) {
  if (rank === 1) return { emoji: "🥇", color: "text-yellow-400" };
  if (rank === 2) return { emoji: "🥈", color: "text-slate-400" };
  if (rank === 3) return { emoji: "🥉", color: "text-amber-600" };
  return { emoji: `#${rank}`, color: "text-[var(--orbit-mute)]" };
}

export function LeaderboardTab({
  events,
  currentAddress,
}: {
  events: ActivityEvent[];
  currentAddress: string | null;
}) {
  const leaderboard = useMemo((): LeaderEntry[] => {
    const map = new Map<string, LeaderEntry>();
    for (const ev of events) {
      const e = map.get(ev.address) ?? {
        address: ev.address,
        totalDeposited: 0n,
        totalWithdrawn: 0n,
        netPosition: 0n,
        txCount: 0,
      };
      if (ev.kind === "deposit") {
        e.totalDeposited += ev.amountStroops;
        e.netPosition += ev.amountStroops;
      } else {
        e.totalWithdrawn += ev.amountStroops;
        e.netPosition -= ev.amountStroops;
      }
      e.txCount += 1;
      map.set(ev.address, e);
    }
    return [...map.values()].sort((a, b) =>
      a.totalDeposited > b.totalDeposited ? -1 : a.totalDeposited < b.totalDeposited ? 1 : 0,
    );
  }, [events]);

  if (leaderboard.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <Trophy className="mx-auto h-10 w-10 text-[var(--orbit-mute)]/40" />
        <div className="mt-4 font-display text-lg">No participants yet</div>
        <p className="mt-2 text-sm text-[var(--orbit-mute)]">
          Be the first to deposit into the Orbit vault and claim the top spot.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top 3 podium */}
      {leaderboard.length >= 1 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {leaderboard.slice(0, 3).map((entry, i) => {
            const { emoji, color } = rankBadge(i + 1);
            const isMe = entry.address === currentAddress;
            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass rounded-2xl p-5 ${isMe ? "border-[var(--orbit-accent)]/40" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`font-mono text-2xl ${color}`}>{emoji}</span>
                  {isMe && (
                    <span className="rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-2 py-0.5 font-mono text-[9px] text-[var(--orbit-accent)]">
                      You
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-[var(--orbit-ink)]">
                  {shortAddr(entry.address)}
                </div>
                <div className="mt-2 font-display text-xl font-semibold text-[var(--orbit-accent)]">
                  {stroopsToXlm(entry.totalDeposited)} XLM
                </div>
                <div className="font-mono text-[10px] text-[var(--orbit-mute)]">
                  Total deposited
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="glass rounded-2xl p-5">
        <h3 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          All Participants ({leaderboard.length})
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry, i) => {
            const { emoji, color } = rankBadge(i + 1);
            const isMe = entry.address === currentAddress;
            return (
              <div
                key={entry.address}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  isMe
                    ? "border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/5"
                    : "border-[var(--orbit-edge)] bg-black/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`font-mono text-base w-8 shrink-0 ${color}`}>{emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--orbit-ink)]">
                        {shortAddr(entry.address)}
                      </span>
                      {isMe && (
                        <span className="rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-1.5 py-0 font-mono text-[8px] text-[var(--orbit-accent)]">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--orbit-mute)]">
                      <ArrowDownToLine className="h-2.5 w-2.5 text-[var(--orbit-ok)]" />
                      {stroopsToXlm(entry.totalDeposited)}
                      <ArrowUpFromLine className="h-2.5 w-2.5 text-[var(--orbit-warn)]" />
                      {stroopsToXlm(entry.totalWithdrawn)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="font-mono text-xs font-semibold text-[var(--orbit-ink)]">
                      {stroopsToXlm(entry.totalDeposited)} XLM
                    </div>
                    <div className="font-mono text-[9px] text-[var(--orbit-mute)]">
                      {entry.txCount} tx
                    </div>
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => toast.success(`Mirroring strategy of ${shortAddr(entry.address)}`)}
                      className="ml-2 rounded-md border border-[var(--orbit-edge)] px-2 py-1 flex items-center gap-1 font-mono text-[9px] uppercase text-[var(--orbit-accent)] hover:bg-[var(--orbit-accent)]/10"
                      title="Copy this user's vault allocations"
                    >
                      <Copy className="h-3 w-3" /> Mirror
                    </button>
                  )}
                  <a
                    href={NETWORK.explorerAccount(entry.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 shrink-0 text-[var(--orbit-mute)] hover:text-[var(--orbit-accent)] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
