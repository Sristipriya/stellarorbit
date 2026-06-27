import { NETWORK } from "./network";

/** Fetch native XLM balance for a Testnet account. */
export async function fetchXlmBalance(address: string): Promise<{ funded: boolean; xlm: string }> {
  try {
    const res = await fetch(`${NETWORK.horizonUrl}/accounts/${address}`);
    if (res.status === 404) return { funded: false, xlm: "0" };
    if (!res.ok) throw new Error(`Horizon ${res.status}`);
    const data = await res.json();
    const native = (data.balances ?? []).find(
      (b: { asset_type: string }) => b.asset_type === "native",
    );
    return { funded: true, xlm: native?.balance ?? "0" };
  } catch {
    return { funded: false, xlm: "0" };
  }
}
