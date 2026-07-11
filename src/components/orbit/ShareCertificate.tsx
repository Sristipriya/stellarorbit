import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle2, Award, TrendingUp, TrendingDown } from "lucide-react";
import { type VaultState } from "@/lib/stellar/vault";
import { stroopsToXlm, shortAddr } from "@/lib/stellar/network";

function pricePerShare(state: VaultState): number {
  if (state.totalSharesStroops === 0n) return 1.0;
  return Number(state.totalAssetsStroops) / Number(state.totalSharesStroops);
}

export function ShareCertificate({
  address,
  state,
  xlmUsdPrice,
}: {
  address: string;
  state: VaultState;
  xlmUsdPrice: number | null;
}) {
  const [copied, setCopied] = useState(false);
  const userShares = state.userSharesStroops;
  const price = pricePerShare(state);
  const pnl = ((price - 1.0) / 1.0) * 100;
  const isUp = pnl >= 0;

  const underlying =
    state.totalSharesStroops === 0n
      ? 0n
      : (userShares * state.totalAssetsStroops) / state.totalSharesStroops;

  const sharesStr = stroopsToXlm(userShares);
  const underlyingStr = stroopsToXlm(underlying);
  const usdVal =
    xlmUsdPrice != null ? `$${(parseFloat(underlyingStr) * xlmUsdPrice).toFixed(2)}` : "—";

  function copyPosition() {
    const text = [
      `🌌 Orbit Vault Position`,
      `Wallet: ${shortAddr(address)}`,
      `Shares: ${sharesStr}`,
      `Underlying: ${underlyingStr} XLM (${usdVal})`,
      `Share Price: ${price.toFixed(6)} XLM`,
      `P&L from parity: ${isUp ? "+" : ""}${pnl.toFixed(2)}%`,
      `Network: Stellar Testnet`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (userShares === 0n) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="cert-card p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20">
            <Award className="h-5 w-5 text-[var(--orbit-accent)]" />
          </div>
          <div>
            <div className="font-display text-base font-semibold">Share Certificate</div>
            <div className="font-mono text-[10px] text-[var(--orbit-mute)]">
              Orbit Vault · Stellar Testnet
            </div>
          </div>
        </div>
        <button
          onClick={copyPosition}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--orbit-edge)] bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors"
        >
          {copied ? (
            <CheckCircle2 className="h-3 w-3 text-[var(--orbit-ok)]" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Main figures */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1">
            Your Shares
          </div>
          <div className="font-display text-3xl font-semibold text-[var(--orbit-accent)]">
            {sharesStr}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1">
            Underlying Value
          </div>
          <div className="font-display text-3xl font-semibold text-[var(--orbit-ink)]">
            {underlyingStr}
          </div>
          <div className="font-mono text-xs text-[var(--orbit-mute)]">{usdVal}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] text-[var(--orbit-mute)]">Share Price</div>
          <div className="font-mono text-sm text-[var(--orbit-ink)]">{price.toFixed(6)} XLM</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-[var(--orbit-mute)]">P&L from Parity</div>
          <div
            className={`flex items-center justify-end gap-1 font-mono text-sm font-semibold ${isUp ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"}`}
          >
            {isUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {isUp ? "+" : ""}
            {pnl.toFixed(2)}%
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-[var(--orbit-mute)]">Holder</div>
          <div className="font-mono text-sm text-[var(--orbit-ink)]">{shortAddr(address)}</div>
        </div>
      </div>
    </motion.div>
  );
}
