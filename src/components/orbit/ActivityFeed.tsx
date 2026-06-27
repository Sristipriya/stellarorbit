import { motion, AnimatePresence } from "framer-motion";
import { NETWORK, shortAddr, stroopsToXlm } from "@/lib/stellar/network";
import type { ActivityEvent } from "@/lib/stellar/events";

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Activity
        </h3>
        <span className="font-mono text-[10px] text-[var(--orbit-mute)]">
          live · reconciled from on-chain
        </span>
      </div>
      {events.length === 0 ? (
        <p className="mt-4 font-mono text-xs text-[var(--orbit-mute)]">
          No activity yet. Be the first to deposit.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-3 py-2 font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      e.kind === "deposit"
                        ? "bg-[var(--orbit-ok)] shadow-[0_0_10px_var(--orbit-ok)]"
                        : "bg-[var(--orbit-warn)] shadow-[0_0_10px_var(--orbit-warn)]"
                    }`}
                  />
                  <span>{shortAddr(e.address)}</span>
                  <span className="text-[var(--orbit-mute)]">
                    {e.kind === "deposit"
                      ? `deposited ${stroopsToXlm(e.amountStroops)} XLM → ${stroopsToXlm(e.sharesStroops)} shares`
                      : `withdrew ${stroopsToXlm(e.sharesStroops)} shares → ${stroopsToXlm(e.amountStroops)} XLM`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[9px] uppercase tracking-widest ${e.confirmed ? "border border-[var(--orbit-ok)]/40 text-[var(--orbit-ok)]" : "border border-[var(--orbit-warn)]/40 text-[var(--orbit-warn)]"}`}
                  >
                    {e.confirmed ? "confirmed" : "pending"}
                  </span>
                  <a
                    href={NETWORK.explorerTx(e.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--orbit-accent)] hover:underline"
                  >
                    {e.txHash.slice(0, 6)}…
                  </a>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
