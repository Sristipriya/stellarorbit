import { motion, AnimatePresence } from "framer-motion";
import { NETWORK, stroopsToXlm } from "@/lib/stellar/network";

export type TxState =
  | { kind: "idle" }
  | { kind: "pending"; label: string }
  | { kind: "success"; title: string; lines: string[]; txHash: string }
  | { kind: "error"; title: string; message: string };

export function TxStatus({ state, raw }: { state: TxState; raw?: string }) {
  return (
    <AnimatePresence mode="wait">
      {state.kind === "pending" && (
        <motion.div key="p" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-[var(--orbit-edge)] bg-black/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--orbit-warn)]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--orbit-warn)]">Pending</span>
            <span className="text-[var(--orbit-mute)]">{state.label}</span>
          </div>
        </motion.div>
      )}
      {state.kind === "success" && (
        <motion.div key="s" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-[color:var(--orbit-ok)]/40 bg-[color:var(--orbit-ok)]/10 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--orbit-ok)]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--orbit-ok)]">Success</span>
            <span>{state.title}</span>
          </div>
          <ul className="mt-2 space-y-0.5 font-mono text-xs text-[var(--orbit-mute)]">
            {state.lines.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          <a href={NETWORK.explorerTx(state.txHash)} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-xs text-[var(--orbit-accent)] underline-offset-4 hover:underline">
            {state.txHash.slice(0, 12)}… ↗
          </a>
          {raw && <DebugRaw raw={raw} />}
        </motion.div>
      )}
      {state.kind === "error" && (
        <motion.div key="e" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-[color:var(--orbit-danger)]/40 bg-[color:var(--orbit-danger)]/10 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--orbit-danger)]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--orbit-danger)]">Error</span>
            <span>{state.title}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--orbit-mute)]">{state.message}</p>
          {raw && <DebugRaw raw={raw} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DebugRaw({ raw }: { raw: string }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">Developer debug</summary>
      <pre className="mt-1 max-h-40 overflow-auto rounded bg-black/40 p-2 font-mono text-[10px]">{raw}</pre>
    </details>
  );
}

export { stroopsToXlm };