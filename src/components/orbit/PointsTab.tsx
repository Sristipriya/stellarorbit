import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle, Star, Trophy, Zap, Share2, Clock } from "lucide-react";
import {
  computeAndSavePoints,
  getMyReferralCode,
  buildReferralLink,
  getReferrerCode,
  formatPoints,
  getAllPoints,
  currentSeason,
  type PointsSnapshot,
} from "@/lib/points";
import type { VaultState } from "@/lib/stellar/vault";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export function PointsTab({
  address,
  state,
}: {
  address: string | null;
  state: VaultState;
}) {
  const [points, setPoints] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allPoints, setAllPoints] = useState<PointsSnapshot[]>([]);
  const animatedPoints = useCountUp(points);

  const season = currentSeason();
  // Season ends every 30 days from genesis
  const msPerSeason = 30 * 24 * 3600 * 1000;
  const msIntoSeason = Date.now() % msPerSeason;
  const daysLeft = Math.ceil((msPerSeason - msIntoSeason) / (24 * 3600 * 1000));

  useEffect(() => {
    if (!address) return;

    // Derive entry timestamp from localStorage positions (if any)
    let entryTs: number | null = null;
    try {
      const raw = localStorage.getItem("orbit:positions:v1");
      if (raw) {
        const positions = JSON.parse(raw) as { walletAddress: string; entryTimestamp: number }[];
        const mine = positions.filter((p) => p.walletAddress === address);
        if (mine.length > 0) {
          entryTs = Math.min(...mine.map((p) => p.entryTimestamp));
        }
      }
    } catch {
      /* noop */
    }

    const pts = computeAndSavePoints(address, state.userSharesStroops, entryTs);
    setPoints(pts);

    const code = getMyReferralCode(address);
    setReferralCode(code);
    setReferralLink(buildReferralLink(address));
    setReferredBy(getReferrerCode());
    setAllPoints(getAllPoints());
  }, [address, state.userSharesStroops]);

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!address) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-[var(--orbit-mute)]">
          Connect your wallet to see your Orbit Points.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Points Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 text-center relative overflow-hidden"
      >
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--orbit-accent)]/10 to-transparent pointer-events-none" />

        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="h-5 w-5 text-[var(--orbit-warn)]" fill="currentColor" />
          <span className="font-mono text-sm uppercase tracking-widest text-[var(--orbit-mute)]">
            Season {season} Points
          </span>
        </div>

        <div className="font-display text-6xl font-bold text-[var(--orbit-accent)] my-3">
          {formatPoints(animatedPoints)}
        </div>

        <p className="font-mono text-xs text-[var(--orbit-mute)]">
          Points = XLM deposited × days held in vault
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--orbit-edge)] bg-black/20 p-3">
            <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-1">
              Your Shares
            </div>
            <div className="font-display text-base font-semibold">
              {(Number(state.userSharesStroops) / 10_000_000).toFixed(4)} orXLM
            </div>
          </div>
          <div className="rounded-xl border border-[var(--orbit-edge)] bg-black/20 p-3">
            <div className="font-mono text-[9px] uppercase text-[var(--orbit-mute)] mb-1 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Season Ends
            </div>
            <div className="font-display text-base font-semibold text-[var(--orbit-warn)]">
              {daysLeft} days
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--orbit-ok)]/20 bg-[var(--orbit-ok)]/10 p-3">
          <p className="font-mono text-xs text-[var(--orbit-ok)]">
            🏆 Top 100 holders at season end receive early access to new vaults + fee discounts.
          </p>
        </div>
      </motion.div>

      {/* Referral Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-4 w-4 text-[var(--orbit-accent)]" />
          <h3 className="font-display text-sm font-semibold">Referral Program</h3>
        </div>

        <p className="text-xs text-[var(--orbit-mute)] mb-4">
          Share your referral link. When friends deposit, you earn{" "}
          <span className="text-[var(--orbit-accent)]">+10% of their points</span> for 90 days.
          They earn +5% bonus points on their first deposit.
        </p>

        {/* Referral code */}
        <div className="mb-3">
          <div className="font-mono text-[10px] uppercase text-[var(--orbit-mute)] mb-1">
            Your Referral Code
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5">
            <span className="font-mono text-sm text-[var(--orbit-accent)] flex-1">{referralCode}</span>
          </div>
        </div>

        {/* Referral link */}
        <div className="mb-4">
          <div className="font-mono text-[10px] uppercase text-[var(--orbit-mute)] mb-1">
            Shareable Link
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2 font-mono text-[10px] text-[var(--orbit-ink)] break-all">
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] transition-all hover:bg-[var(--orbit-accent)]/20"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-[var(--orbit-ok)]" />
              ) : (
                <Copy className="h-4 w-4 text-[var(--orbit-mute)]" />
              )}
            </button>
          </div>
        </div>

        {referredBy && (
          <div className="rounded-xl border border-[var(--orbit-accent)]/20 bg-[var(--orbit-accent)]/10 p-3">
            <p className="font-mono text-[10px] text-[var(--orbit-accent)]">
              ✅ You were referred by code: <strong>{referredBy}</strong>. Bonus points active!
            </p>
          </div>
        )}
      </motion.div>

      {/* Mini Leaderboard */}
      {allPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-[var(--orbit-warn)]" />
            <h3 className="font-display text-sm font-semibold">Season Leaderboard</h3>
            <span className="ml-auto font-mono text-[9px] text-[var(--orbit-mute)]">
              top {Math.min(allPoints.length, 10)}
            </span>
          </div>
          <div className="space-y-2">
            {allPoints.slice(0, 10).map((snap, i) => {
              const isMe = snap.walletAddress === address;
              return (
                <div
                  key={snap.walletAddress}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                    isMe
                      ? "border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10"
                      : "border-[var(--orbit-edge)] bg-black/20"
                  }`}
                >
                  <span
                    className={`font-mono text-sm font-bold w-6 text-center ${
                      i === 0
                        ? "text-[var(--orbit-warn)]"
                        : i === 1
                        ? "text-slate-400"
                        : i === 2
                        ? "text-amber-700"
                        : "text-[var(--orbit-mute)]"
                    }`}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono text-xs ${isMe ? "text-[var(--orbit-accent)]" : "text-[var(--orbit-ink)]"}`}>
                      {snap.walletAddress.slice(0, 4)}…{snap.walletAddress.slice(-4)}
                      {isMe && " (you)"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[var(--orbit-warn)]" />
                    <span className="font-mono text-xs font-semibold text-[var(--orbit-ink)]">
                      {formatPoints(snap.totalPoints)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
