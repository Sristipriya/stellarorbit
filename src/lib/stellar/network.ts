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
  "CBLDIHKSHOXC3Q3R2YNCT54OPTX5QRALNYKK3UDNZ4KAQD7DEINJYV5P";

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

export const ORBIT_USDC_CONTRACT_ID: string | undefined =
  "CBM6JPPGBESHXXPW6YKGSM2W6CVEL7KHQ6WDWXVDBSY2QWHD4K6R4N2I";

export const ORBIT_USDC_TOKEN_ID = ORBIT_USDC_CONTRACT_ID;

export const ORBIT_INDEX_CONTRACT_ID: string | undefined =
  "CAXSCGC7FNM3GKPE4BDHYUV2YWC5K3DKRVX5AOR7YP6DIXQNWFYCP2JS";

export const ORBIT_INDEX_TOKEN_ID = ORBIT_INDEX_CONTRACT_ID;

export const ORBIT_POINTS_CONTRACT_ID: string | undefined =
  "CA4L4FLXCN7WXDUFV2IUAJFA2B6OXON63GQJL3SSVA7VQKNHGVLEQT2I";
export const ORBIT_ZAP_ROUTER_ID: string | undefined =
  "CA7FJN365S3KEWMKLRCCAY3SWXOQ63TLXO5HNTQPXPT4I2OXPVMXFNMZ";

export const ORBIT_TRANCHE_CONTRACT_ID: string | undefined = "CCDFIR4MGQC7KHZ25EZ3ELIB4QKGBWQ67ZWFS3J5UAR25FLBQBGW3QF7";
export const ORBIT_MARKET_CONTRACT_ID: string | undefined = "CBU7OPCENTV6XT33IYNBNYVC7YU2PNQD4X22TBAI4R72Q2QBVMERLGWT";
export const ORBIT_PT_TOKEN_ID: string | undefined = "CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL";
export const ORBIT_YT_TOKEN_ID: string | undefined = "CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR";
