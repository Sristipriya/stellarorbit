/**
 * Orbit Multi-Vault Registry
 *
 * Defines all available vaults and their metadata. In production this reads
 * from the on-chain VaultRegistry contract. For now it is a hardcoded list
 * that can be overridden by setting VITE_VAULT_REGISTRY_ID.
 *
 * Each vault has:
 *  - id:            unique key used for routing and storage
 *  - name:          human-readable name
 *  - description:   one-line description for cards
 *  - assetSymbol:   e.g. "XLM", "USDC"
 *  - contractId:    deployed Soroban contract address (undefined = demo mode)
 *  - assetId:       Stellar Asset Contract address for the underlying token
 *  - strategy:      short strategy description
 *  - risk:          "low" | "medium" | "high"
 *  - color:         accent color for UI
 *  - icon:          emoji or icon name for card
 */

export type VaultMeta = {
  id: string;
  name: string;
  description: string;
  assetSymbol: string;
  contractId: string | undefined;
  assetId: string;
  strategy: string;
  risk: "low" | "medium" | "high";
  color: string; // CSS color string
  icon: string; // emoji
};

// ── Native XLM SAC on Testnet ─────────────────────────────────────────────
const XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// ── USDC SAC on Testnet (Circle/Stellar official testnet USDC) ─────────────
// This is a well-known testnet USDC anchor SAC address.
const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export const VAULTS: VaultMeta[] = [
  {
    id: "xlm",
    name: "Orbit XLM Vault",
    description: "Deposit XLM, earn real yield via Blend Protocol lending.",
    assetSymbol: "XLM",
    contractId: (import.meta.env.VITE_ORBIT_VAULT_CONTRACT_ID as string | undefined) || "CDRDDSKIZW4Q2PTA2B3RFAX4ILY5ZPGJF2IQNPQPNKJ3EQFTORD3MCIX",
    assetId: XLM_SAC,
    strategy: "Blend Protocol Lending",
    risk: "low",
    color: "oklch(0.82 0.16 195)",
    icon: "⭐",
  },
  {
    id: "usdc",
    name: "Orbit USDC Vault",
    description: "Stablecoin yield on USDC via Blend + Aquarius LP.",
    assetSymbol: "USDC",
    contractId: (import.meta.env.VITE_ORBIT_USDC_CONTRACT_ID as string | undefined),
    assetId: USDC_SAC,
    strategy: "Blend Lending + Aquarius LP",
    risk: "low",
    color: "oklch(0.78 0.13 225)",
    icon: "💵",
  },
  {
    id: "index",
    name: "Orbit Index Vault",
    description: "Auto-rebalanced XLM+USDC basket for diversified yield.",
    assetSymbol: "XLM+USDC",
    contractId: (import.meta.env.VITE_ORBIT_INDEX_CONTRACT_ID as string | undefined),
    assetId: XLM_SAC, // Index primarily denominated in XLM
    strategy: "Auto-Rebalanced Basket",
    risk: "medium",
    color: "oklch(0.82 0.17 155)",
    icon: "📊",
  },
];

export function getVaultById(id: string): VaultMeta | undefined {
  return VAULTS.find((v) => v.id === id);
}

export const DEFAULT_VAULT_ID = "xlm";
