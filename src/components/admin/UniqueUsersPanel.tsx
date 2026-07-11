import { useMemo } from "react";
import { ExternalLink, Users } from "lucide-react";
import { type ActivityEvent } from "@/lib/stellar/events";
import { stroopsToXlm, shortAddr, NETWORK } from "@/lib/stellar/network";

export function UniqueUsersPanel({ events }: { events: ActivityEvent[] }) {
  const users = useMemo(() => {
    const map = new Map<string, { deposits: number; withdrawals: number; volume: bigint }>();
    for (const ev of events) {
      const u = map.get(ev.address) ?? { deposits: 0, withdrawals: 0, volume: 0n };
      if (ev.kind === "deposit") {
        u.deposits += 1;
        u.volume += ev.amountStroops;
      } else {
        u.withdrawals += 1;
      }
      map.set(ev.address, u);
    }
    return [...map.entries()].sort((a, b) => (a[1].volume > b[1].volume ? -1 : 1));
  }, [events]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-[var(--orbit-mute)]" />
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Unique Wallets ({users.length})
        </h3>
      </div>

      {users.length === 0 ? (
        <div className="py-8 text-center font-mono text-xs text-[var(--orbit-mute)]">
          No activity yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {users.map(([addr, stats]) => (
            <div
              key={addr}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-4 py-2.5"
            >
              <div className="min-w-0">
                <div className="font-mono text-xs text-[var(--orbit-ink)]">{shortAddr(addr)}</div>
                <div className="font-mono text-[9px] text-[var(--orbit-mute)]">
                  {stats.deposits} dep · {stats.withdrawals} wd
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--orbit-accent)]">
                  {stroopsToXlm(stats.volume)} XLM
                </span>
                <a
                  href={NETWORK.explorerAccount(addr)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--orbit-mute)] hover:text-[var(--orbit-accent)] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
