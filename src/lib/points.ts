import { ORBIT_POINTS_CONTRACT_ID } from "./stellar/network";
import { readContract, invokeContract, addrArg } from "./stellar/soroban";

export type LeaderboardEntry = {
  walletAddress: string;
  displayName: string | null;
  totalPoints: number;
  rank: number;
};

/** Get the on-chain points for a wallet. */
export async function getPoints(walletAddress: string): Promise<number> {
  if (!ORBIT_POINTS_CONTRACT_ID) return 0;
  try {
    const raw = await readContract<bigint | number>(
      "get_points",
      [addrArg(walletAddress)],
      ORBIT_POINTS_CONTRACT_ID,
    );
    return Number(raw);
  } catch {
    return 0;
  }
}

/** Get the on-chain referrer for a wallet. */
export async function getReferrer(walletAddress: string): Promise<string | null> {
  if (!ORBIT_POINTS_CONTRACT_ID) return null;
  try {
    const raw = await readContract<string>(
      "get_referrer",
      [addrArg(walletAddress)],
      ORBIT_POINTS_CONTRACT_ID,
    );
    return raw || null;
  } catch {
    return null;
  }
}

/** Set the referrer on-chain. */
export async function setReferrer(walletAddress: string, referrerAddress: string): Promise<void> {
  if (!ORBIT_POINTS_CONTRACT_ID) return;
  if (walletAddress === referrerAddress) return;
  try {
    await invokeContract(ORBIT_POINTS_CONTRACT_ID, "set_referrer", [
      addrArg(walletAddress),
      addrArg(referrerAddress),
    ]);
  } catch (e) {
    console.error("Failed to set referrer", e);
  }
}

/**
 * Build a leaderboard.
 * Since we don't have an off-chain indexer to query all Soroban state for the demo,
 * we return a mocked top list but prepend the user's actual on-chain points if available.
 */
export async function buildLeaderboard(currentUser?: string | null): Promise<LeaderboardEntry[]> {
  const dummy: LeaderboardEntry[] = [
    { walletAddress: "GBX...A12B", displayName: "WhaleHunter", totalPoints: 12500, rank: 1 },
    { walletAddress: "GCA...F90D", displayName: "DeFi Chad", totalPoints: 8900, rank: 2 },
    { walletAddress: "GDA...E32C", displayName: "Yield Farmer", totalPoints: 4200, rank: 3 },
  ];

  if (currentUser) {
    const userPts = await getPoints(currentUser);
    let displayName = null;
    try {
      displayName = localStorage.getItem(`orbit:display-name:${currentUser}`) ?? null;
    } catch {
      /* noop */
    }

    // Insert user into correct rank
    const userEntry = { walletAddress: currentUser, displayName, totalPoints: userPts, rank: 0 };
    const all = [...dummy, userEntry].sort((a, b) => b.totalPoints - a.totalPoints);
    return all.map((e, i) => ({ ...e, rank: i + 1 }));
  }

  return dummy;
}

export function formatPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(2)}M`;
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(2)}K`;
  return pts.toFixed(2);
}

/* ─────────────────────── Referral System ────────────────────────────────── */

const LS_REFERRED_BY = "orbit:referral:referred_by";

/** Get or create the referral code for this wallet. We use the raw address for on-chain. */
export function getMyReferralCode(walletAddress: string): string {
  return walletAddress;
}

/** Persist the referral code that brought this user in (from URL param). */
export function saveReferrerCode(code: string) {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(LS_REFERRED_BY)) {
    localStorage.setItem(LS_REFERRED_BY, code);
  }
}

/** Get the referrer code that was applied to this session. */
export function getReferrerCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_REFERRED_BY);
}

/** Parse referral code from URL and persist if found. */
export function handleReferralFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) saveReferrerCode(ref);
}

/** Generate a shareable referral link for this wallet. */
export function buildReferralLink(walletAddress: string): string {
  const code = getMyReferralCode(walletAddress);
  const base = typeof window !== "undefined" ? window.location.origin : "https://orbit.finance";
  return `${base}/app?ref=${code}`;
}
