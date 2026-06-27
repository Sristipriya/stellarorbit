import { NETWORK } from "./network";

export async function fundWithFriendbot(
  address: string,
): Promise<{ ok: true; hash?: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${NETWORK.friendbotUrl}?addr=${encodeURIComponent(address)}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) return { ok: false, error: "Friendbot rate-limit hit — try again in a minute." };
      return { ok: false, error: body || `Friendbot failed (${res.status})` };
    }
    const json: { hash?: string } = await res.json().catch(() => ({}));
    return { ok: true, hash: json.hash };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error talking to Friendbot." };
  }
}