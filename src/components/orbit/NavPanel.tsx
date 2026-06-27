import { motion } from "framer-motion";
import { STROOPS_PER_XLM, stroopsToXlm } from "@/lib/stellar/network";
import type { VaultState } from "@/lib/stellar/vault";

function fmtPrice(scaled: bigint): string {
  // scaled by 1e7
  const whole = scaled / STROOPS_PER_XLM;
  const frac = (scaled % STROOPS_PER_XLM).toString().padStart(7, "0").slice(0, 6);
  return `${whole.toString()}.${frac}`;
}

export function NavPanel({ state, loading }: { state: VaultState; loading: boolean }) {
  const userValue =
    state.totalSharesStroops === 0n
      ? 0n
      : (state.userSharesStroops * state.totalAssetsStroops) / state.totalSharesStroops;

  const stats: Array<{ label: string; value: string; accent?: boolean; mono?: boolean }> = [
    {
      label: "NAV (Total Assets)",
      value: `${stroopsToXlm(state.totalAssetsStroops)} XLM`,
      accent: true,
    },
    { label: "Total Shares", value: stroopsToXlm(state.totalSharesStroops) },
    { label: "Price / Share", value: `${fmtPrice(state.pricePerShareScaled)} XLM`, mono: true },
    { label: "Your Value", value: `${stroopsToXlm(userValue)} XLM`, accent: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Live NAV
        </h3>
        <span className="flex items-center gap-2 font-mono text-[10px] text-[var(--orbit-mute)]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              loading ? "bg-[var(--orbit-warn)]" : "bg-[var(--orbit-ok)]"
            } shadow-[0_0_8px_currentColor]`}
          />
          {loading ? "syncing…" : "from contract state"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--orbit-edge)] bg-black/20 p-3"
          >
            <div className="text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              {s.label}
            </div>
            <div
              className={`mt-1 font-display text-lg md:text-xl ${s.accent ? "text-[var(--orbit-accent)]" : ""} ${s.mono ? "font-mono" : ""}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
