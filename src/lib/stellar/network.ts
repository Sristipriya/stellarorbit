/**
 * Stellar Testnet network configuration for Orbit.
 * Mainnet is intentionally disabled — Orbit is testnet-only.
 */
export const NETWORK = {
  name: "TESTNET" as const,
  passphrase: "Test SDF Network ; September 2015",
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  explorerTx: (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
  explorerAccount: (id: string) => `https://stellar.expert/explorer/testnet/account/${id}`,
};

/** Set this once you've deployed contracts/orbit-vault to Testnet. */
export const ORBIT_VAULT_CONTRACT_ID: string | undefined =
  "CDRDDSKIZW4Q2PTA2B3RFAX4ILY5ZPGJF2IQNPQPNKJ3EQFTORD3MCIX";

export const HAS_REAL_CONTRACT = Boolean(ORBIT_VAULT_CONTRACT_ID);

/** XLM has 7 decimals on Stellar; Soroban i128 uses stroops (1 XLM = 1e7). */
export const STROOPS_PER_XLM = 10_000_000n;

export function xlmToStroops(xlm: number | string): bigint {
  const s = typeof xlm === "number" ? xlm.toString() : xlm;
  const [whole, frac = ""] = s.split(".");
  const fracPadded = (frac + "0000000").slice(0, 7);
  return BigInt(whole || "0") * STROOPS_PER_XLM + BigInt(fracPadded || "0");
}

export function stroopsToXlm(stroops: bigint | number | string, dp = 4): string {
  const n = typeof stroops === "bigint" ? stroops : BigInt(stroops);
  const whole = n / STROOPS_PER_XLM;
  const frac = (n % STROOPS_PER_XLM).toString().padStart(7, "0").slice(0, dp);
  return `${whole.toString()}.${frac}`;
}

export function shortAddr(addr: string | null | undefined): string {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
