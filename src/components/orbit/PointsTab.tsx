import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
  Users,
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import {
  getPoints,
  getMyReferralCode,
  buildReferralLink,
  getReferrerCode,
  formatPoints,
  getReferralCount,
  getReferrer,
  applyReferralCode,
  updateDisplayName
} from "@/lib/points";
import { stroopsToXlm, shortAddr } from "@/lib/stellar/network";
import type { VaultState } from "@/lib/stellar/vault";

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
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

export function PointsTab({ address, state }: { address: string | null; state: VaultState }) {
  const [points, setPoints] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Apply referral state
  const [inputRefCode, setInputRefCode] = useState("");
  const [applyingRef, setApplyingRef] = useState(false);

  // Edit display name
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const animatedPoints = useCountUp(points);

  const season = 1;
  const msPerSeason = 30 * 24 * 3600 * 1000;
  const msIntoSeason = Date.now() % msPerSeason;
  const daysLeft = Math.ceil((msPerSeason - msIntoSeason) / (24 * 3600 * 1000));

  async function loadData() {
    if (!address) return;
    setLoading(true);
    try {
      const pts = await getPoints(address);
      setPoints(pts);

      const code = getMyReferralCode(address);
      setReferralCode(code);
      setReferralLink(buildReferralLink(address));

      const count = await getReferralCount(address);
      setReferralCount(count);

      const backendReferrer = await getReferrer(address);
      setReferredBy(backendReferrer || getReferrerCode());
    } catch (err) {
      console.error("Failed to load points data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [address]);

  function handleCopyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleShareTwitter() {
    const text = encodeURIComponent(
      `Earn automated DeFi yield on Stellar with Orbit Protocol.\n\nJoin Season 1 and earn bonus XP with my invite link:\n${referralLink}\n\n#Stellar #Soroban #DeFi #Orbit`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }

  async function handleApplyCode() {
    if (!address || !inputRefCode.trim()) return;
    setApplyingRef(true);
    const res = await applyReferralCode(address, inputRefCode.trim());
    setApplyingRef(false);
    if (res.success) {
      toast.success(res.message);
      setInputRefCode("");
      loadData();
    } else {
      toast.error(res.message);
    }
  }

  async function handleSaveName() {
    if (!address || !displayName.trim()) return;
    setSavingName(true);
    const ok = await updateDisplayName(address, displayName.trim());
    setSavingName(false);
    if (ok) {
      toast.success("Display name updated!");
    } else {
      toast.error("Failed to update display name");
    }
  }

  // Tier logic
  const currentTier =
    points >= 5000 ? "Titan" : points >= 1500 ? "Whale" : points >= 500 ? "Pioneer" : points >= 100 ? "Voyager" : "Cadet";
  const nextTierPoints =
    points >= 5000 ? 5000 : points >= 1500 ? 5000 : points >= 500 ? 1500 : points >= 100 ? 500 : 100;
  const progressToNext = Math.min(100, Math.round((points / nextTierPoints) * 100));

  if (!address) {
    return (
      <div className="relative overflow-hidden rounded-3xl p-[1px] max-w-2xl mx-auto">
        <div className="relative bg-[#050505]/95 backdrop-blur-xl rounded-[23px] p-12 text-center border border-[var(--orbit-edge)]">
          <h3 className="font-display text-lg font-bold text-white mb-2">Connect Wallet</h3>
          <p className="font-mono text-xs text-[var(--orbit-mute)]">
            Connect your Stellar wallet to view your Season 1 Points, referral stats, and tier rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero Points Card - styled matching WithdrawCard */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] group transition-all duration-500 hover:shadow-[0_0_40px_-10px_var(--orbit-accent)]">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--orbit-accent)] to-transparent opacity-20 transition-opacity duration-500 group-hover:opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--orbit-accent)] to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-20 group-hover:animate-pulse" />

        {/* Card Content */}
        <div className="relative bg-[#050505]/95 backdrop-blur-xl rounded-[23px] p-6 lg:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-accent)] font-semibold">
                  Season 0{season} · Live
                </span>
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
                  {daysLeft} Days Remaining
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                Orbit Points & Rewards
              </h2>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-white/5 px-3 py-1.5 font-mono text-xs text-[var(--orbit-mute)] hover:text-white hover:border-white/20 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[var(--orbit-accent)]" : ""}`} />
              <span>Sync</span>
            </button>
          </div>

          {/* Points Display */}
          <div className="my-4 rounded-2xl border border-white/5 bg-black/40 p-6 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--orbit-mute)] mb-1">
              Your Total Season Points
            </div>
            <div className="font-display text-5xl sm:text-6xl font-extrabold text-[var(--orbit-accent)] tracking-tight">
              {formatPoints(animatedPoints)}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-[var(--orbit-mute)]">
              <span>Tier:</span>
              <span className="text-white font-bold">{currentTier}</span>
              <span>·</span>
              <span>{points} / {nextTierPoints} XP to next milestone</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 mx-auto max-w-md h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
              <div
                className="h-full bg-[var(--orbit-accent)] rounded-full transition-all duration-1000"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>

          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3.5">
              <div className="text-[10px] uppercase text-[var(--orbit-mute)] mb-1">Shares Held</div>
              <div className="font-display text-base font-bold text-white">
                {stroopsToXlm(state.userSharesStroops || 0n)}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3.5">
              <div className="text-[10px] uppercase text-[var(--orbit-mute)] mb-1">Direct Referrals</div>
              <div className="font-display text-base font-bold text-white">
                {referralCount}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3.5">
              <div className="text-[10px] uppercase text-[var(--orbit-mute)] mb-1">Deposit Multiplier</div>
              <div className="font-display text-base font-bold text-[var(--orbit-accent)]">
                1.0x – 2.0x
              </div>
            </div>

            <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3.5">
              <div className="text-[10px] uppercase text-[var(--orbit-mute)] mb-1">Kickback Rate</div>
              <div className="font-display text-base font-bold text-white">
                +10%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] group transition-all duration-500 hover:shadow-[0_0_40px_-10px_var(--orbit-accent)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--orbit-accent)] to-transparent opacity-15" />
        
        <div className="relative bg-[#050505]/95 backdrop-blur-xl rounded-[23px] p-6 lg:p-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/10 text-[var(--orbit-accent)] border border-[var(--orbit-accent)]/20">
                <Share2 className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                Referral Program
              </h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
              On-Chain Verified
            </span>
          </div>

          <p className="font-mono text-xs text-[var(--orbit-mute)]">
            Invite friends to deposit into Orbit vaults. You earn an immediate <span className="text-white font-semibold">+50 bonus XP</span> plus <span className="text-[var(--orbit-accent)] font-semibold">10% ongoing kickback</span> on all points generated by their deposits.
          </p>

          {/* Referral Link & Code Inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Your Referral Code */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--orbit-mute)]">
                Your Referral Code
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-2 focus-within:border-[var(--orbit-accent)]">
                <input
                  readOnly
                  value={referralCode}
                  className="w-full bg-transparent font-mono text-xs text-white outline-none select-all truncate"
                />
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white hover:bg-white/10 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="h-3 w-3 text-[var(--orbit-ok)]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Shareable Link */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--orbit-mute)]">
                Shareable Link
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-2 focus-within:border-[var(--orbit-accent)]">
                <input
                  readOnly
                  value={referralLink}
                  className="w-full bg-transparent font-mono text-xs text-white outline-none select-all truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white hover:bg-white/10 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3 w-3 text-[var(--orbit-ok)]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/50 px-4 py-2 font-mono text-xs text-white hover:border-[var(--orbit-accent)]/50 hover:bg-[var(--orbit-accent)]/10 transition-all cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
              <span>Share on X (Twitter)</span>
            </button>
          </div>

          {/* Apply Referrer Section (if not already applied) */}
          {!referredBy && (
            <div className="border-t border-white/5 pt-5 space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--orbit-mute)] block">
                Have a Referral Code? Apply for +50 Bonus XP
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter inviter wallet address or code..."
                  value={inputRefCode}
                  onChange={(e) => setInputRefCode(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--orbit-edge)] bg-black/40 px-3.5 py-2 font-mono text-xs text-white placeholder:text-[var(--orbit-mute)]/40 focus:border-[var(--orbit-accent)] outline-none"
                />
                <button
                  onClick={handleApplyCode}
                  disabled={applyingRef || !inputRefCode.trim()}
                  className="rounded-xl border border-[var(--orbit-accent)]/40 bg-[var(--orbit-accent)] px-4 py-2 font-mono text-xs font-semibold text-black hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {applyingRef ? "Applying..." : "Apply Code"}
                </button>
              </div>
            </div>
          )}

          {referredBy && (
            <div className="rounded-xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/[0.04] p-3 font-mono text-xs flex items-center justify-between">
              <span className="text-[var(--orbit-mute)]">Active Inviter:</span>
              <span className="text-[var(--orbit-accent)] font-semibold truncate max-w-[200px] sm:max-w-xs">
                {shortAddr(referredBy)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rules Breakdown Table */}
      <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6 space-y-4 font-mono text-xs">
        <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
          Season 01 Earning Mechanics
        </h4>
        <div className="divide-y divide-[var(--orbit-edge)]">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--orbit-mute)]">Standard Vault Deposit</span>
            <span className="font-semibold text-white">1 XP per 10 XLM deposited</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--orbit-mute)]">Cross-Asset Zap Deposit</span>
            <span className="font-semibold text-[var(--orbit-accent)]">2 XP per 10 XLM (2.0x Boost)</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--orbit-mute)]">Friend Referral Invite</span>
            <span className="font-semibold text-white">+50 XP instant bonus</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--orbit-mute)]">Ongoing Referral Kickback</span>
            <span className="font-semibold text-[var(--orbit-accent)]">10% of all referee points</span>
          </div>
        </div>
      </div>
    </div>
  );
}

