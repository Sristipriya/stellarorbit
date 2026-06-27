import { motion } from "framer-motion";
import { shortAddr, stroopsToXlm } from "@/lib/stellar/network";
import type { VaultState } from "@/lib/stellar/vault";

export function PositionCard({
  address,
  state,
  xlmBalance,
}: {
  address: string | null;
  state: VaultState;
  xlmBalance: string | null;
}) {
  const userShares = state.userSharesStroops;
  const underlying =
    state.totalSharesStroops === 0n
      ? 0n
      : (userShares * state.totalAssetsStroops) / state.totalSharesStroops;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Your Position
        </h3>
        <span className="font-mono text-xs text-[var(--orbit-mute)]">{shortAddr(address)}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat
          label="XLM Wallet"
          value={xlmBalance ? `${Number(xlmBalance).toFixed(4)} XLM` : "—"}
        />
        <Stat label="Your Shares" value={`${stroopsToXlm(userShares)}`} />
        <Stat label="Underlying" value={`${stroopsToXlm(underlying)} XLM`} accent />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--orbit-edge)] bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">{label}</div>
      <div className={`mt-1 font-display text-xl ${accent ? "text-[var(--orbit-accent)]" : ""}`}>
        {value}
      </div>
    </div>
  );
}
