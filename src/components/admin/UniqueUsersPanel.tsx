import { useEffect, useState } from "react";
import { ExternalLink, Users, Calendar, Clock, Hash } from "lucide-react";
import { type ActivityEvent } from "@/lib/stellar/events";
import { shortAddr, NETWORK } from "@/lib/stellar/network";
import { getAllUsers, getAllTransactions, type UserProfile, type UserTransaction } from "@/lib/user-transactions";

export function UniqueUsersPanel({ events }: { events?: ActivityEvent[] }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllUsers(100), getAllTransactions(200)])
      .then(([u, txs]) => {
        setProfiles(u);
        setTransactions(txs);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--orbit-accent)]" />
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
            Registered Users & Wallets ({profiles.length})
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[var(--orbit-ok)] bg-[var(--orbit-ok)]/10 px-2.5 py-0.5 rounded-full">
          Supabase Isolated
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center font-mono text-xs text-[var(--orbit-mute)]">
          Loading user records...
        </div>
      ) : profiles.length === 0 ? (
        <div className="py-8 text-center font-mono text-xs text-[var(--orbit-mute)]">
          No users registered in database yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {profiles.map((p) => {
            const userTxs = transactions.filter(
              (t) => t.wallet_address.toLowerCase() === p.wallet_address.toLowerCase()
            );

            return (
              <div
                key={p.wallet_address}
                className="rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-4 space-y-3 hover:border-[var(--orbit-accent)]/40 transition-colors"
              >
                {/* User Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-white">
                        {p.display_name || "Anonymous User"}
                      </span>
                      {p.points > 0 && (
                        <span className="font-mono text-[9px] bg-[var(--orbit-accent)]/20 text-[var(--orbit-accent)] px-2 py-0.5 rounded-full">
                          {p.points} XP
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[var(--orbit-mute)] mt-0.5">
                      {p.wallet_address}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--orbit-mute)]">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[var(--orbit-ok)]" />
                      <span>Joined {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <a
                      href={NETWORK.explorerAccount(p.wallet_address)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[var(--orbit-accent)] hover:underline"
                    >
                      Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* User Transactions List */}
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2 flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    <span>Transaction Hashes ({userTxs.length})</span>
                  </div>

                  {userTxs.length === 0 ? (
                    <div className="font-mono text-[10px] text-[var(--orbit-mute)]/60 italic pl-2">
                      No on-chain transactions recorded for this wallet yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {userTxs.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-3 py-1.5 font-mono text-[10px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`uppercase font-bold ${
                              tx.type === "deposit" || tx.type === "faucet" ? "text-[var(--orbit-ok)]" :
                              tx.type === "withdraw" ? "text-[var(--orbit-warn)]" :
                              "text-[var(--orbit-accent)]"
                            }`}>
                              {tx.type}
                            </span>
                            <span className="text-[var(--orbit-mute)]">·</span>
                            <span className="text-white">{tx.amount} {tx.asset}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[var(--orbit-mute)]">
                              {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <a
                              href={NETWORK.explorerTx(tx.tx_hash)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--orbit-accent)] hover:underline flex items-center gap-1"
                            >
                              {shortAddr(tx.tx_hash)} <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
