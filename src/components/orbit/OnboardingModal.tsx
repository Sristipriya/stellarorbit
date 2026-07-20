import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Rocket, CheckCircle2 } from "lucide-react";

interface OnboardingModalProps {
  walletAddress: string;
  onComplete: () => void;
}

export function OnboardingModal({ walletAddress, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await supabase.from("profiles").update({ display_name: name.trim() }).eq("wallet_address", walletAddress);
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (e) {
      console.error("Failed to save name", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-[2rem] border border-[var(--orbit-edge)]/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--orbit-accent)]/10 border border-[var(--orbit-accent)]/20 shadow-[0_0_30px_var(--orbit-accent-soft)]">
          <Rocket className="h-8 w-8 text-[var(--orbit-accent)]" />
        </div>
        
        <h2 className="text-center font-display text-2xl font-bold text-white mb-2">
          Welcome to Orbit
        </h2>
        
        <p className="text-center text-sm text-[var(--orbit-mute)] mb-8">
          You're connected! Set a display name to appear on the global leaderboard.
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
              className="orbit-input text-lg py-3 px-4 w-full bg-black/40 border-white/10 focus:border-[var(--orbit-accent)] focus:ring-1 focus:ring-[var(--orbit-accent)]"
              disabled={loading || success}
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading || success}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--orbit-accent)] px-4 py-3.5 font-display text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_var(--orbit-accent-soft)] overflow-hidden"
          >
            {success ? (
              <><CheckCircle2 className="h-4 w-4" /> Ready for Launch</>
            ) : loading ? (
              "Saving..."
            ) : (
              "Complete Setup"
            )}
          </button>
          
          {!success && !loading && (
            <button
              onClick={onComplete}
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
