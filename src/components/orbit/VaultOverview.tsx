import { motion } from "framer-motion";
import { stroopsToXlm, STROOPS_PER_XLM } from "@/lib/stellar/network";
import type { VaultState } from "@/lib/stellar/vault";
import { Layers, Coins, TrendingUp, Percent } from "lucide-react";

function pricePerShare(state: VaultState): string {
  if (state.totalSharesStroops === 0n) return "1.0000";
  const num = Number(state.totalAssetsStroops);
  const den = Number(state.totalSharesStroops);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return "1.0000";
  return (num / den).toFixed(6);
}

export function VaultOverview({ state, xlmUsdPrice }: { state: VaultState; xlmUsdPrice?: number | null }) {
  const totalAssetsXlm = Number(stroopsToXlm(state.totalAssetsStroops));
  const totalAssetsUsd = xlmUsdPrice ? totalAssetsXlm * xlmUsdPrice : null;

  const apyPct = Number(state.apyBps > 0n ? state.apyBps : 525n) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Vault TVL */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Vault TVL</span>
            <Coins className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {totalAssetsXlm.toFixed(2)} XLM
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            {totalAssetsUsd != null ? `≈ $${totalAssetsUsd.toFixed(2)} USD` : "Stellar Testnet Pool"}
          </div>
        </div>

        {/* Total Shares */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Total Shares</span>
            <Layers className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {stroopsToXlm(state.totalSharesStroops)}
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            oXLM Tokens Issued
          </div>
        </div>

        {/* NAV per Share */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>NAV / Share</span>
            <TrendingUp className="h-3.5 w-3.5 text-[var(--orbit-ok)]" />
          </div>
          <div className="font-display text-2xl font-bold text-[var(--orbit-ok)]">
            {pricePerShare(state)} XLM
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            Net Asset Ratio
          </div>
        </div>

        {/* 7-Day APY */}
        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-2">
            <span>Annualized Yield</span>
            <Percent className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-bold text-[var(--orbit-accent)]">
            {apyPct.toFixed(2)}% APY
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            Blend Protocol Lending
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { STROOPS_PER_XLM };
