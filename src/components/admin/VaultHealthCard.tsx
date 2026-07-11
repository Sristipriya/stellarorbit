import { motion } from "framer-motion";
import { type VaultState } from "@/lib/stellar/vault";
import { stroopsToXlm } from "@/lib/stellar/network";
import { NETWORK, HAS_REAL_CONTRACT, ORBIT_VAULT_CONTRACT_ID } from "@/lib/stellar/network";
import { ExternalLink, Server, FileCode2, Activity } from "lucide-react";

function pricePerShare(state: VaultState): string {
  if (state.totalSharesStroops === 0n) return "1.0000000";
  return (Number(state.totalAssetsStroops) / Number(state.totalSharesStroops)).toFixed(7);
}

export function VaultHealthCard({ state }: { state: VaultState }) {
  const rows = [
    {
      k: "Contract Mode",
      v: HAS_REAL_CONTRACT ? "Live Soroban Contract" : "Demo Mode",
      ok: HAS_REAL_CONTRACT,
    },
    { k: "Network", v: NETWORK.name },
    { k: "Soroban RPC", v: NETWORK.sorobanRpcUrl, link: NETWORK.sorobanRpcUrl },
    { k: "Horizon URL", v: NETWORK.horizonUrl, link: NETWORK.horizonUrl },
    {
      k: "Contract ID",
      v: ORBIT_VAULT_CONTRACT_ID ?? "Not deployed (demo mode)",
      link: ORBIT_VAULT_CONTRACT_ID
        ? `https://stellar.expert/explorer/testnet/contract/${ORBIT_VAULT_CONTRACT_ID}`
        : undefined,
    },
    { k: "Total Assets", v: `${stroopsToXlm(state.totalAssetsStroops)} XLM` },
    { k: "Total Shares", v: stroopsToXlm(state.totalSharesStroops) },
    { k: "Share Price", v: `${pricePerShare(state)} XLM` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-4 w-4 text-[var(--orbit-mute)]" />
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Vault Health
        </h3>
      </div>
      <div className="space-y-2">
        {rows.map(({ k, v, link, ok }) => (
          <div
            key={k}
            className="flex items-start justify-between gap-4 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-4 py-2.5"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] shrink-0 pt-0.5">
              {k}
            </span>
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] text-[var(--orbit-accent)] hover:underline text-right break-all"
              >
                {v} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            ) : (
              <span
                className={`font-mono text-[10px] text-right break-all ${
                  ok === true
                    ? "text-[var(--orbit-ok)]"
                    : ok === false
                      ? "text-[var(--orbit-warn)]"
                      : "text-[var(--orbit-ink)]"
                }`}
              >
                {v}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
