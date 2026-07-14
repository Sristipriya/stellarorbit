/**
 * Orbit Points System
 *
 * Orbit Points = deposit_amount_xlm × time_in_vault_days
 *
 * Points are calculated client-side from localStorage position records and
 * current vault state. They are accumulated into a persistent store in
 * localStorage so they survive page refreshes.
 *
 * When a proper backend (Supabase) is added, this module acts as a drop-in
 * that can be replaced with an API call.
 *
 * Points are used for:
 *   - Leaderboard ranking
 *   - Season rewards (season = 30 days)
 *   - Future airdrop eligibility
 */

import { STROOPS_PER_XLM } from "./stellar/network";

const LS_POINTS_CACHE = "orbit:points:v1";
const SECONDS_PER_DAY = 86_400;

export type PointsSnapshot = {
  walletAddress: string;
  totalPoints: number; // accumulated across all positions
  lastUpdatedAt: number; // unix timestamp
  season: number; // current season index (0 = genesis)
};

export type LeaderboardEntry = {
  walletAddress: string;
  displayName: string | null;
  totalPoints: number;
  rank: number;
};

function readPointsCache(): Record<string, PointsSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_POINTS_CACHE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePointsCache(cache: Record<string, PointsSnapshot>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_POINTS_CACHE, JSON.stringify(cache));
}

/** Calculate current season index (season changes every 30 days from epoch). */
export function currentSeason(): number {
  const daysSinceEpoch = Math.floor(Date.now() / 1000 / SECONDS_PER_DAY);
  return Math.floor(daysSinceEpoch / 30);
}

/**
 * Compute and persist Orbit Points for a wallet.
 *
 * Points = Σ (shares_held_xlm × days_held)
 *
 * Call this after every vault state refresh for the connected wallet.
 */
export function computeAndSavePoints(
  walletAddress: string,
  userSharesStroops: bigint,
  entryTimestamp: number | null,
): number {
  const now = Math.floor(Date.now() / 1000);
  const daysHeld = entryTimestamp ? Math.max(0, (now - entryTimestamp) / SECONDS_PER_DAY) : 0;
  const sharesXlm = Number(userSharesStroops) / Number(STROOPS_PER_XLM);
  const earned = sharesXlm * daysHeld;

  const cache = readPointsCache();
  const existing = cache[walletAddress];
  const season = currentSeason();

  // Only update if points increased meaningfully (avoid write spam)
  const newPoints = Math.floor(earned * 100) / 100;
  if (!existing || newPoints > existing.totalPoints || existing.season !== season) {
    cache[walletAddress] = {
      walletAddress,
      totalPoints: newPoints,
      lastUpdatedAt: now,
      season,
    };
    writePointsCache(cache);
  }

  return cache[walletAddress]?.totalPoints ?? newPoints;
}

/** Get the cached points for a wallet. */
export function getPoints(walletAddress: string): number {
  const cache = readPointsCache();
  return cache[walletAddress]?.totalPoints ?? 0;
}

/** Get ALL point entries for leaderboard construction. */
export function getAllPoints(): PointsSnapshot[] {
  const cache = readPointsCache();
  return Object.values(cache).sort((a, b) => b.totalPoints - a.totalPoints);
}

/**
 * Build a leaderboard from all cached points.
 * Merges display names from localStorage (orbit:display-name per wallet).
 */
export function buildLeaderboard(): LeaderboardEntry[] {
  const snapshots = getAllPoints();
  return snapshots.map((snap, idx) => {
    // Attempt to read display name stored per wallet
    let displayName: string | null = null;
    try {
      displayName = localStorage.getItem(`orbit:display-name:${snap.walletAddress}`) ?? null;
    } catch {
      /* noop */
    }
    return {
      walletAddress: snap.walletAddress,
      displayName,
      totalPoints: snap.totalPoints,
      rank: idx + 1,
    };
  });
}

/** Format points for display. */
export function formatPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(2)}M`;
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(2)}K`;
  return pts.toFixed(2);
}

/* ─────────────────────── Referral System ────────────────────────────────── */

const LS_REFERRAL_CODE = "orbit:referral:code";
const LS_REFERRED_BY = "orbit:referral:referred_by";

/** Generate a deterministic referral code from wallet address. */
export function generateReferralCode(walletAddress: string): string {
  // Use first 8 + last 4 chars to create a recognizable but short code
  return `ORBIT-${walletAddress.slice(0, 4)}${walletAddress.slice(-4)}`.toUpperCase();
}

/** Get or create the referral code for this wallet. */
export function getMyReferralCode(walletAddress: string): string {
  if (typeof window === "undefined") return generateReferralCode(walletAddress);
  const stored = localStorage.getItem(`${LS_REFERRAL_CODE}:${walletAddress}`);
  if (stored) return stored;
  const code = generateReferralCode(walletAddress);
  localStorage.setItem(`${LS_REFERRAL_CODE}:${walletAddress}`, code);
  return code;
}

/** Persist the referral code that brought this user in (from URL param). */
export function saveReferrerCode(code: string) {
  if (typeof window === "undefined") return;
  // Only save once (don't overwrite)
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
