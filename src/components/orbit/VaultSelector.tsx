import { motion } from "framer-motion";
import { TrendingUp, Lock, CheckCircle } from "lucide-react";
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

const RISK_COLOR: Record<VaultMeta["risk"], string> = {
  low: "var(--orbit-ok)",
  medium: "var(--orbit-warn)",
  high: "var(--orbit-danger)",
};

export function VaultCard({ vault, isSelected, tvlXlm, apyPct, onClick }: VaultCardProps) {
  const isLive = Boolean(vault.contractId);
  const apyDisplay =
    apyPct != null && apyPct > 0
      ? `${apyPct.toFixed(2)}% APY`
      : isLive
        ? "Accruing..."
        : "Coming Soon";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full rounded-2xl p-5 text-left transition-all duration-200 ${
        isSelected
          ? "border-2 shadow-[0_0_20px_var(--orbit-accent)/30]"
          : "border hover:border-[var(--orbit-edge)]/80"
      }`}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${vault.color}15, transparent)`
          : "rgba(0,0,0,0.35)",
        borderColor: isSelected ? vault.color : "var(--orbit-edge)",
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3">
          <CheckCircle className="h-4 w-4" style={{ color: vault.color }} />
        </div>
      )}

      {/* Coming soon badge */}
      {!isLive && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-[var(--orbit-edge)] bg-black/40 px-2 py-0.5">
          <Lock className="h-2.5 w-2.5 text-[var(--orbit-mute)]" />
          <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-mute)]">
            Soon
          </span>
        </div>
      )}

      {/* Icon + asset */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
          style={{ background: `${vault.color}20` }}
        >
          {vault.icon}
        </div>
        <div>
          <div className="font-display text-base font-semibold leading-tight">{vault.name}</div>
          <div className="font-mono text-[10px] text-[var(--orbit-mute)]">{vault.assetSymbol}</div>
        </div>
      </div>

      <p className="text-xs text-[var(--orbit-mute)] mb-4 line-clamp-2">{vault.description}</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "TVL",
            value: tvlXlm ? `${tvlXlm} XLM` : isLive ? "—" : "—",
          },
          {
            label: "APY",
            value: apyDisplay,
          },
          {
            label: "Risk",
            value: RISK_LABEL[vault.risk],
            color: RISK_COLOR[vault.risk],
          },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-black/20 p-2 text-center">
            <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-mute)] mb-0.5">
              {s.label}
            </div>
            <div
              className="font-mono text-[10px] font-semibold truncate"
              style={{ color: s.color ?? "var(--orbit-ink)" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Strategy chip */}
      <div className="mt-3 flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3 text-[var(--orbit-mute)]" />
        <span className="font-mono text-[9px] text-[var(--orbit-mute)]">{vault.strategy}</span>
      </div>
    </motion.button>
  );
}

/* ──────────── Vault Selector Grid ───────────────────────── */

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
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Choose Vault
        </h3>
        <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
          {vaults.filter((v) => v.contractId).length} live ·{" "}
          {vaults.filter((v) => !v.contractId).length} coming soon
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
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
