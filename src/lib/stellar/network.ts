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

/** Orbit Contracts (Testnet) */
export const ORBIT_VAULT_CONTRACT_ID = "CDIKVEXGEHC2FBKP5P7YYZGKFZQUVKN5E4G26NFC7KKU5MLFR27JDIDC"; 
export const ORBIT_YIELD_STRATEGY_ID = "CBWP5XTLC3G7OB4TMOX4IOKZBQFSIHEUGUXJW4Q7LOOVR2L2MQSTKIJQ";
export const ORBIT_OXLM_SHARE_TOKEN_ID = "CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ"; 

export const ORBIT_TRANCHE_CONTRACT_ID = "CDHHUSJSZCQ2OLOP34HFK32JSGP66P2RB4BKKKB6MLYETQ5KS6PU67JO"; 
export const ORBIT_PT_TOKEN_ID = "CCHQYE3A7SM4QVE4LLEQGJYFUC3GFLXAQNPOBIAETK4HGAC7Z5OPW3EM"; 
export const ORBIT_YT_TOKEN_ID = "CATIYO5RV5JC556HMT664NHZJVSLAPKPDRRWNQ3IDPLNGLDW7OQ3FRJO";

export const ORBIT_MARKET_CONTRACT_ID = "CBU7OPCENTV6XT33IYNBNYVC7YU2PNQD4X22TBAI4R72Q2QBVMERLGWT";
export const ORBIT_POINTS_CONTRACT_ID = "CA4L4FLXCN7WXDUFV2IUAJFA2B6OXON63GQJL3SSVA7VQKNHGVLEQT2I";
export const ORBIT_ZAP_ROUTER_ID = "CC3QRFH3O7D7S77CAO6LABIRHXY6W5AJV5SQCKMGCXUVAHMAU3ALX427";

export const ORBIT_USDC_CONTRACT_ID = "CBM6JPPGBESHXXPW6YKGSM2W6CVEL7KHQ6WDWXVDBSY2QWHD4K6R4N2I";
export const ORBIT_USDC_TOKEN_ID = ORBIT_USDC_CONTRACT_ID;

export const ORBIT_INDEX_CONTRACT_ID = "CAXSCGC7FNM3GKPE4BDHYUV2YWC5K3DKRVX5AOR7YP6DIXQNWFYCP2JS";
export const ORBIT_INDEX_TOKEN_ID = ORBIT_INDEX_CONTRACT_ID;

export const HAS_REAL_CONTRACT = Boolean(ORBIT_VAULT_CONTRACT_ID);

/** XLM has 7 decimals on Stellar; Soroban i128 uses stroops (1 XLM = 1e7). */
export const STROOPS_PER_XLM = 10_000_000n;

export function xlmToStroops(xlm: number | string | null | undefined): bigint {
  if (!xlm && xlm !== 0) return 0n;
  try {
    const s = typeof xlm === "number" ? xlm.toString() : String(xlm || "0");
    const [whole, frac = ""] = s.split(".");
    const fracPadded = (frac + "0000000").slice(0, 7);
    return BigInt(whole || "0") * STROOPS_PER_XLM + BigInt(fracPadded || "0");
  } catch {
    return 0n;
  }
}

export function stroopsToXlm(stroops: bigint | number | string | null | undefined, dp = 4): string {
  if (stroops === null || stroops === undefined) return "0.0000";
  try {
    const n = typeof stroops === "bigint" ? stroops : BigInt(stroops || 0);
    const whole = n / STROOPS_PER_XLM;
    const frac = (n % STROOPS_PER_XLM).toString().padStart(7, "0").slice(0, dp);
    return `${whole.toString()}.${frac}`;
  } catch {
    return "0.0000";
  }
}

export function shortAddr(addr: string | null | undefined): string {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

