/**
 * Oracle price — fetches XLM/USD spot price from Stellar Expert public API.
 * This demonstrates the SEP-40 oracle architecture for the multi-asset RWA
 * index. Falls back gracefully if the API is unavailable.
 */

const CACHE_TTL_MS = 60_000; // 1 minute

let cached: { price: number; ts: number } | null = null;

/** Fetch XLM/USD from Stellar Expert aggregated ticker. */
export async function fetchXlmUsdPrice(): Promise<number | null> {
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.price;
  try {
    // Stellar Expert exposes a simple ticker endpoint
    const res = await fetch(
      "https://api.stellar.expert/explorer/testnet/asset/XLM/price?period=1h",
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { price?: number; data?: number[][] };
    // The endpoint returns { data: [[timestamp, price, ...], ...] }
    let price: number | null = null;
    if (typeof json.price === "number") {
      price = json.price;
    } else if (Array.isArray(json.data) && json.data.length > 0) {
      const last = json.data[json.data.length - 1];
      price = typeof last[1] === "number" ? last[1] : null;
    }
    if (price != null && price > 0) {
      cached = { price, ts: Date.now() };
      return price;
    }
    return null;
  } catch {
    // Fallback to a secondary source
    try {
      const res2 = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd", {
        signal: AbortSignal.timeout(5000),
      });
      if (!res2.ok) throw new Error("coingecko failed");
      const j2 = (await res2.json()) as { stellar?: { usd?: number } };
      const p2 = j2.stellar?.usd ?? null;
      if (p2 != null) {
        cached = { price: p2, ts: Date.now() };
        return p2;
      }
    } catch {
      // both sources failed — return null
    }
    return null;
  }
}

/** Format XLM amount as USD string, e.g. "$12.34" */
export function xlmToUsd(xlm: number | string, priceUsd: number | null): string {
  if (priceUsd == null) return "—";
  const n = typeof xlm === "string" ? parseFloat(xlm) : xlm;
  if (!Number.isFinite(n)) return "—";
  const usd = n * priceUsd;
  if (usd < 0.01) return "< $0.01";
  return `$${usd.toFixed(2)}`;
}
