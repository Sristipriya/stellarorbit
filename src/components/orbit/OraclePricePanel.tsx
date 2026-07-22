import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, RefreshCcw, Zap } from "lucide-react";
import { fetchXlmUsdPrice, xlmToUsd } from "@/lib/oracle-price";
import { stroopsToXlm } from "@/lib/stellar/network";
import { type VaultState } from "@/lib/stellar/vault";

export function OraclePricePanel({ state }: { state: VaultState }) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function refresh() {
    setLoading(true);
    const p = await fetchXlmUsdPrice();
    setPrice(p);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, []);

  const totalAssetsXlm = stroopsToXlm(state.totalAssetsStroops);
  const totalAssetsUsd = xlmToUsd(totalAssetsXlm, price);

  const sharePriceXlm =
    state.totalSharesStroops === 0n
      ? 1.0
      : Number(state.totalAssetsStroops) / Number(state.totalSharesStroops);
  const sharePriceUsd = xlmToUsd(sharePriceXlm.toFixed(7), price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--orbit-warn)]/20">
            <Zap className="h-3.5 w-3.5 text-[var(--orbit-warn)]" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">SEP-40 Oracle Price</div>
            <div className="font-mono text-[10px] text-[var(--orbit-mute)]">
              XLM / USD · Testnet
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--orbit-edge)] bg-white/[0.04] px-2 py-1.5 font-mono text-[10px] text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--orbit-edge)] bg-black/30 p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
            XLM / USD
          </div>
          <div className="font-display text-xl font-semibold text-[var(--orbit-warn)]">
            {price != null ? `$${price.toFixed(4)}` : loading ? "…" : "—"}
          </div>
          <div className="font-mono text-[9px] text-[var(--orbit-mute)] mt-1">Spot Price</div>
        </div>

        <div className="rounded-xl border border-[var(--orbit-edge)] bg-black/30 p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
            Vault TVL
          </div>
          <div className="font-display text-xl font-semibold text-[var(--orbit-ink)]">
            {totalAssetsUsd}
          </div>
          <div className="font-mono text-[9px] text-[var(--orbit-mute)] mt-1">
            {totalAssetsXlm} XLM
          </div>
        </div>

        <div className="rounded-xl border border-[var(--orbit-edge)] bg-black/30 p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
            Share Price
          </div>
          <div className="font-display text-xl font-semibold text-[var(--orbit-accent)]">
            {sharePriceUsd}
          </div>
          <div className="font-mono text-[9px] text-[var(--orbit-mute)] mt-1">
            {sharePriceXlm.toFixed(5)} XLM
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-3 flex items-center gap-1.5">
          <DollarSign className="h-3 w-3 text-[var(--orbit-mute)]" />
          <span className="font-mono text-[9px] text-[var(--orbit-mute)]">
            Updated {lastUpdated.toLocaleTimeString()} · Powered by Stellar Expert · SEP-40
            architecture preview
          </span>
        </div>
      )}
    </motion.div>
  );
}
