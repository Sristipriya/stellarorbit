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
  "CDIKVEXGEHC2FBKP5P7YYZGKFZQUVKN5E4G26NFC7KKU5MLFR27JDIDC";
export const ORBIT_YIELD_STRATEGY_ID: string | undefined =
  "CBWP5XTLC3G7OB4TMOX4IOKZBQFSIHEUGUXJW4Q7LOOVR2L2MQSTKIJQ";

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
  "CC3QRFH3O7D7S77CAO6LABIRHXY6W5AJV5SQCKMGCXUVAHMAU3ALX427";

// v2 tranche - uses transfer_from (no nested user auth needed)
export const ORBIT_TRANCHE_CONTRACT_ID: string | undefined = "CBOCF47NMQAT7TS4X4CTS7D3MPAD4MIPMOBZPUE5EOM52WTAIOOVJDCU";
export const ORBIT_MARKET_CONTRACT_ID: string | undefined = "CBU7OPCENTV6XT33IYNBNYVC7YU2PNQD4X22TBAI4R72Q2QBVMERLGWT";
export const ORBIT_PT_TOKEN_ID: string | undefined = "CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL";
export const ORBIT_YT_TOKEN_ID: string | undefined = "CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR";
// oXLM share token - needed for approve step before wrapping shares
export const ORBIT_OXLM_SHARE_TOKEN_ID: string | undefined = "CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ";
