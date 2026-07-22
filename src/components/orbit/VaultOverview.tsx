import { motion } from "framer-motion";
import { stroopsToXlm, STROOPS_PER_XLM } from "@/lib/stellar/network";
import type { VaultState } from "@/lib/stellar/vault";

function pricePerShare(state: VaultState): string {
  if (state.totalSharesStroops === 0n) return "1.0000";
  // price = totalAssets / totalShares, both in stroops → ratio
  const num = Number(state.totalAssetsStroops);
  const den = Number(state.totalSharesStroops);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return "1.0000";
  return (num / den).toFixed(4);
}

export function VaultOverview({ state }: { state: VaultState }) {
  const stats = [
    { label: "Total Assets", value: `${stroopsToXlm(state.totalAssetsStroops)} XLM`, accent: true },
    { label: "Total Shares", value: stroopsToXlm(state.totalSharesStroops) },
    { label: "Price / Share", value: `${pricePerShare(state)} XLM` },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Vault Overview
        </h3>
        <span className="font-mono text-[10px] text-[var(--orbit-mute)]">XLM · single-asset</span>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--orbit-edge)] bg-black/20 p-3 min-w-0"
          >
            <div className="text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              {s.label}
            </div>
            <div
              className={`mt-1 font-display text-lg sm:text-xl font-semibold truncate ${s.accent ? "text-[var(--orbit-accent)]" : ""}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export { STROOPS_PER_XLM };
