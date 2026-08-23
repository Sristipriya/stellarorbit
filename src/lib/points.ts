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

/** Get the count of referred users for this wallet. */
export async function getReferralCount(walletAddress: string): Promise<number> {
  if (typeof window === "undefined" || !walletAddress) return 0;
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", walletAddress);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/** Update user display name in Supabase */
export async function updateDisplayName(walletAddress: string, displayName: string): Promise<boolean> {
  if (typeof window === "undefined" || !walletAddress) return false;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("wallet_address", walletAddress);
    return !error;
  } catch {
    return false;
  }
}

/** Apply a referral code to the current user */
export async function applyReferralCode(walletAddress: string, code: string): Promise<{ success: boolean; message: string }> {
  if (typeof window === "undefined" || !walletAddress) return { success: false, message: "Wallet not connected" };
  const cleanCode = code.trim();
  if (cleanCode === walletAddress) return { success: false, message: "Cannot refer your own wallet" };
  if (!cleanCode) return { success: false, message: "Please enter a valid code" };

  try {
    // Check if referrer exists
    const { data: referrer } = await supabase
      .from("profiles")
      .select("wallet_address, points")
      .or(`wallet_address.eq.${cleanCode},referral_code.eq.${cleanCode}`)
      .single();

    if (!referrer) {
      return { success: false, message: "Referral code not found on network" };
    }

    // Check if user already has a referrer
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("referred_by, points")
      .eq("wallet_address", walletAddress)
      .single();

    if (userProfile?.referred_by) {
      return { success: false, message: "A referral code is already active on your account" };
    }

    // Apply referrer & award bonus points
    const userBonus = (userProfile?.points || 0) + 50;
    await supabase
      .from("profiles")
      .update({
        referred_by: referrer.wallet_address,
        points: userBonus,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress);

    // Award bonus to referrer
    const referrerBonus = (referrer.points || 0) + 50;
    await supabase
      .from("profiles")
      .update({
        points: referrerBonus,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", referrer.wallet_address);

    saveReferrerCode(referrer.wallet_address);
    return { success: true, message: "Referral applied! +50 bonus XP awarded to you & your referrer." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to apply referral code" };
  }
}

/** Initialize or update a user's profile directly in Supabase DB */
export async function registerUser(walletAddress: string) {
  if (typeof window === "undefined" || !walletAddress) return;
  try {
    const code = getMyReferralCode(walletAddress);
    const referredBy = getReferrerCode();
    
    // Prevent self-referral
    const finalReferredBy = (referredBy && referredBy !== code) ? referredBy : null;

    await supabase.from("profiles").upsert(
      {
        wallet_address: walletAddress,
        referral_code: code,
        referred_by: finalReferredBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    );
  } catch (e) {
    console.error("[Orbit DB] Failed to register user profile in Supabase", e);
  }
}

