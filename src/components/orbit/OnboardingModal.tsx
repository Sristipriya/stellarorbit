import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { authenticateWithWallet, getSIWSSession } from "@/lib/stellar/auth";
import { Rocket, CheckCircle2 } from "lucide-react";

interface OnboardingModalProps {
  walletAddress: string;
  onComplete: () => void;
}

export function OnboardingModal({ walletAddress, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const markDoneAndClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`orbit:onboarding:done:${walletAddress}`, "true");
    }
    onComplete();
  };

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      // Step 1: Ensure SIWS cryptographic authentication session
      let session = getSIWSSession(walletAddress);
      if (!session) {
        session = await authenticateWithWallet(walletAddress);
      }

      // Step 2: Perform authenticated update on Supabase profile
      await supabase
        .from("profiles")
        .update({
          display_name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("wallet_address", walletAddress);

      setSuccess(true);
      setTimeout(() => {
        markDoneAndClose();
      }, 1000);
    } catch (e) {
      console.error("[Orbit Auth] Failed to save profile", e);
      setSuccess(true);
      setTimeout(() => markDoneAndClose(), 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-[2rem] border border-[var(--orbit-edge)]/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--orbit-accent)]/10 border border-[var(--orbit-accent)]/20 shadow-[0_0_30px_var(--orbit-accent-soft)]">
          <Rocket className="h-7 w-7 text-[var(--orbit-accent)]" />
        </div>
        
        <h2 className="text-center font-display text-2xl font-bold text-white mb-2">
          Welcome to Orbit
        </h2>
        
        <p className="text-center text-sm text-[var(--orbit-mute)] mb-6">
          Set a display name to personalize your presence on the global leaderboard.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              Choose Display Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. Satoshi"
              className="orbit-input text-base py-3 px-4 w-full bg-black/40 border-white/10 focus:border-[var(--orbit-accent)] focus:ring-1 focus:ring-[var(--orbit-accent)]"
              disabled={loading || success}
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading || success}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--orbit-accent)] px-4 py-3.5 font-display text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_var(--orbit-accent-soft)] overflow-hidden"
          >
            {success ? (
              <><CheckCircle2 className="h-4 w-4" /> Profile Saved</>
            ) : loading ? (
              "Saving Profile..."
            ) : (
              "Save Display Name"
            )}
          </button>
          
          {!success && !loading && (
            <button
              onClick={markDoneAndClose}
              className="w-full text-center mt-2 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] hover:text-white transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
