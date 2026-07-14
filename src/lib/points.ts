import { supabase } from "./supabase";

export type LeaderboardEntry = {
  walletAddress: string;
  displayName: string | null;
  totalPoints: number;
  rank: number;
};

/** Get the points for a wallet from Supabase. */
export async function getPoints(walletAddress: string): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("points")
      .eq("wallet_address", walletAddress)
      .single();
    return data ? Number(data.points) : 0;
  } catch {
    return 0;
  }
}

/** Get the referrer for a wallet. */
export async function getReferrer(walletAddress: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("wallet_address", walletAddress)
      .single();
    return data?.referred_by || null;
  } catch {
    return null;
  }
}

/** 
 * Build a leaderboard.
 * Fetches the top 100 users from Supabase, ordered by points.
 */
export async function buildLeaderboard(currentUser?: string | null): Promise<LeaderboardEntry[]> {
  if (typeof window === "undefined") return [];
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_address, display_name, points")
      .order("points", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    let leaderboard: LeaderboardEntry[] = data.map((row, i) => ({
      walletAddress: row.wallet_address,
      displayName: row.display_name,
      totalPoints: Number(row.points),
      rank: i + 1,
    }));

    // Ensure the current user is in the list, if they are not in the top 100
    if (currentUser && !leaderboard.find((e) => e.walletAddress === currentUser)) {
      const userPoints = await getPoints(currentUser);
      leaderboard.push({
        walletAddress: currentUser,
        displayName: null,
        totalPoints: userPoints,
        rank: 0,
      });
      // Re-sort
      leaderboard = leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
      // Re-rank
      leaderboard = leaderboard.map((e, i) => ({ ...e, rank: i + 1 }));
    }

    return leaderboard;
  } catch (e) {
    console.error("Failed to build leaderboard", e);
    return [];
  }
}

export function formatPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(2)}M`;
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(2)}K`;
  return pts.toFixed(2);
}

/* ─────────────────────── Referral System ────────────────────────────────── */

const LS_REFERRED_BY = "orbit:referral:referred_by";

/** Get or create the referral code for this wallet. We use the raw address. */
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

/** Initialize a user's profile in Supabase on connection */
export async function registerUser(walletAddress: string) {
  if (typeof window === "undefined") return;
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("wallet_address", walletAddress)
      .single();

    if (!existing) {
      const code = getMyReferralCode(walletAddress);
      const referredBy = getReferrerCode();
      
      // Prevent self-referral
      const finalReferredBy = (referredBy && referredBy !== code) ? referredBy : null;

      await supabase.from("profiles").insert({
        wallet_address: walletAddress,
        referral_code: code,
        referred_by: finalReferredBy,
        points: 0
      });
    }
  } catch (e) {
    console.error("Failed to register user", e);
  }
}
