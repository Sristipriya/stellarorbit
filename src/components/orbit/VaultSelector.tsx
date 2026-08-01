import { motion } from "framer-motion";
import { TrendingUp, Lock, CheckCircle2, Coins, DollarSign, Layers } from "lucide-react";
import type { VaultMeta } from "@/lib/stellar/vaults";

type VaultCardProps = {
  vault: VaultMeta;
  isSelected: boolean;
  tvlXlm?: string;
  apyPct?: number;
  onClick: () => void;
};

const RISK_LABEL: Record<VaultMeta["risk"], string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

export function VaultCard({ vault, isSelected, tvlXlm, apyPct, onClick }: VaultCardProps) {
  const isLive = Boolean(vault.contractId);
  const effectiveApy = apyPct != null && apyPct > 0 ? apyPct : vault.id === 'xlm' ? 5.25 : vault.id === 'usdc' ? 8.5 : 12.4;
  const apyDisplay = isLive ? `${effectiveApy.toFixed(2)}% APY` : "Coming Soon";

  const renderIcon = () => {
    switch (vault.iconType) {
      case "xlm":
        return <Coins className="h-5 w-5 text-indigo-400" />;
      case "usdc":
        return <DollarSign className="h-5 w-5 text-emerald-400" />;
      case "index":
      default:
        return <Layers className="h-5 w-5 text-sky-400" />;
    }
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`relative w-full rounded-2xl p-5 text-left transition-all duration-150 ${
        isSelected
          ? "border-2 border-[var(--orbit-accent)] bg-[#12121a]"
          : "border border-[var(--orbit-edge)] bg-black/40 hover:border-white/20"
      }`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute right-3.5 top-3.5">
          <CheckCircle2 className="h-4 w-4 text-[var(--orbit-accent)]" />
        </div>
      )}

      {/* Coming soon badge */}
      {!isLive && (
        <div className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full border border-[var(--orbit-edge)] bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
          <Lock className="h-2.5 w-2.5" /> Soon
        </div>
      )}

      {/* Vector Icon + asset details */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--orbit-edge)] bg-white/[0.03]">
          {renderIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold text-white leading-tight truncate">{vault.name}</div>
          <div className="font-mono text-[10px] text-[var(--orbit-mute)]">{vault.assetSymbol}</div>
        </div>
      </div>

      <p className="text-xs text-[var(--orbit-mute)] mb-4 leading-relaxed line-clamp-2">{vault.description}</p>

      {/* Stats Matrix */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[var(--orbit-edge)] bg-white/[0.02] p-2 text-center">
          <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-mute)] mb-0.5">TVL</div>
          <div className="font-mono text-[11px] font-bold text-white truncate">
            {tvlXlm ? `${tvlXlm} XLM` : isLive ? "—" : "—"}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--orbit-edge)] bg-white/[0.02] p-2 text-center">
          <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-mute)] mb-0.5">APY</div>
          <div className="font-mono text-[11px] font-bold text-[var(--orbit-ok)] truncate">
            {apyDisplay}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--orbit-edge)] bg-white/[0.02] p-2 text-center">
          <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-mute)] mb-0.5">Risk</div>
          <div className="font-mono text-[11px] font-bold text-[var(--orbit-accent)] truncate">
            {RISK_LABEL[vault.risk]}
          </div>
        </div>
      </div>

      {/* Strategy info */}
      <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-[var(--orbit-edge)]/40">
        <TrendingUp className="h-3 w-3 text-[var(--orbit-mute)] shrink-0" />
        <span className="font-mono text-[9px] text-[var(--orbit-mute)] truncate">{vault.strategy}</span>
      </div>
    </motion.button>
  );
}

export function VaultSelector({
  vaults,
  selectedId,
  onSelect,
  vaultStats,
}: {
  vaults: VaultMeta[];
  selectedId: string;
  onSelect: (id: string) => void;
  vaultStats?: Record<string, { tvlXlm?: string; apyPct?: number }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          CHOOSE VAULT
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
          {vaults.filter((v) => v.contractId).length} LIVE · {vaults.filter((v) => !v.contractId).length} COMING SOON
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {vaults.map((vault) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            isSelected={selectedId === vault.id}
            tvlXlm={vaultStats?.[vault.id]?.tvlXlm}
            apyPct={vaultStats?.[vault.id]?.apyPct}
            onClick={() => vault.contractId && onSelect(vault.id)}
          />
        ))}
      </div>
    </div>
  );
}
