/**
 * Orbit Multi-Vault Registry
 */

export type VaultMeta = {
  id: string;
  name: string;
  description: string;
  assetSymbol: string;
  contractId: string | undefined;
  assetId: string;
  trancheId?: string;
  marketId?: string;
  ptId?: string;
  ytId?: string;
  strategy: string;
  risk: "low" | "medium" | "high";
  color: string;
  iconType: "xlm" | "usdc" | "index";
};

import {
  ORBIT_VAULT_CONTRACT_ID,
  ORBIT_TRANCHE_CONTRACT_ID,
  ORBIT_MARKET_CONTRACT_ID,
  ORBIT_PT_TOKEN_ID,
  ORBIT_YT_TOKEN_ID,
} from "./network";

const XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export const VAULTS: VaultMeta[] = [
  {
    id: "xlm",
    name: "Orbit XLM Vault",
    description: "Deposit XLM, earn real yield via Blend Protocol lending.",
    assetSymbol: "XLM",
    contractId: ORBIT_VAULT_CONTRACT_ID,
    assetId: XLM_SAC,
    trancheId: ORBIT_TRANCHE_CONTRACT_ID,
    marketId: ORBIT_MARKET_CONTRACT_ID,
    ptId: ORBIT_PT_TOKEN_ID,
    ytId: ORBIT_YT_TOKEN_ID,
    strategy: "Blend Protocol Lending",
    risk: "low",
    color: "#6366f1",
    iconType: "xlm",
  },
  {
    id: "usdc",
    name: "Orbit USDC Vault",
    description: "Stablecoin yield on USDC via Blend + Aquarius LP.",
    assetSymbol: "USDC",
    contractId: import.meta.env.VITE_ORBIT_USDC_CONTRACT_ID as string | undefined,
    assetId: USDC_SAC,
    trancheId: import.meta.env.VITE_ORBIT_USDC_TRANCHE_ID,
    marketId: import.meta.env.VITE_ORBIT_USDC_MARKET_ID,
    ptId: import.meta.env.VITE_ORBIT_USDC_PT_ID,
    ytId: import.meta.env.VITE_ORBIT_USDC_YT_ID,
    strategy: "Blend Lending + Aquarius LP",
    risk: "low",
    color: "#10b981",
    iconType: "usdc",
  },
  {
    id: "index",
    name: "Orbit Index Vault",
    description: "Auto-rebalanced XLM+USDC basket for diversified yield.",
    assetSymbol: "XLM+USDC",
    contractId: import.meta.env.VITE_ORBIT_INDEX_CONTRACT_ID as string | undefined,
    assetId: XLM_SAC,
    trancheId: import.meta.env.VITE_ORBIT_INDEX_TRANCHE_ID,
    marketId: import.meta.env.VITE_ORBIT_INDEX_MARKET_ID,
    ptId: import.meta.env.VITE_ORBIT_INDEX_PT_ID,
    ytId: import.meta.env.VITE_ORBIT_INDEX_YT_ID,
    strategy: "Auto-Rebalanced Basket",
    risk: "medium",
    color: "#0ea5e9",
    iconType: "index",
  },
];

export function getVaultById(id: string): VaultMeta | undefined {
  return VAULTS.find((v) => v.id === id);
}

export const DEFAULT_VAULT_ID = "xlm";
