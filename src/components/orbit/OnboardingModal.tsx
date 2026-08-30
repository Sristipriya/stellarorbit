import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, User, Mail, Phone } from "lucide-react";
import { OrbitLogo } from "@/components/orbit/OrbitLogo";

interface OnboardingModalProps {
  walletAddress: string;
  onComplete: () => void;
}

function validate(name: string, email: string, phone: string) {
  if (!name.trim() || name.trim().length < 2) return "Name must be at least 2 characters.";
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
  if (!phone.trim() || !/^\+?[0-9\s\-().]{7,15}$/.test(phone.trim())) return "Enter a valid phone number.";
  return null;
}

export function OnboardingModal({ walletAddress, onComplete }: OnboardingModalProps) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSave() {
    const validationError = validate(name, email, phone);
    if (validationError) { setError(validationError); return; }
    setError(null);
    setLoading(true);
    try {
      const now = new Date().toISOString();
      // Upsert profile with all required fields
      const { error: dbErr } = await supabase
        .from("profiles")
        .upsert({
          wallet_address: walletAddress,
          display_name:   name.trim(),
          email:          email.trim().toLowerCase(),
          phone:          phone.trim(),
          updated_at:     now,
          last_seen_at:   now,
        }, { onConflict: "wallet_address" });

      if (dbErr) throw dbErr;

      setSuccess(true);
      setTimeout(() => {
        localStorage.setItem(`orbit:onboarding:done:${walletAddress}`, "true");
        onComplete();
      }, 1000);
    } catch (e: any) {
      setError(e?.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = !name.trim() || !email.trim() || !phone.trim() || loading || success;

  const inputClass =
    "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[var(--orbit-accent)] focus:ring-1 focus:ring-[var(--orbit-accent)] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-[2rem] border border-[var(--orbit-edge)]/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {/* Icon */}
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--orbit-accent)]/10 border border-[var(--orbit-accent)]/20 shadow-[0_0_30px_var(--orbit-accent-soft)]">
          <OrbitLogo size={36} />
        </div>

        <h2 className="text-center font-display text-2xl font-bold text-white mb-1">
          Complete Your Profile
        </h2>
        <p className="text-center text-sm text-[var(--orbit-mute)] mb-6">
          Required to access Orbit. Your details are stored securely.
        </p>

        <div className="space-y-4">

          {/* Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              <User className="h-3 w-3" /> Full Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="e.g. Satoshi Nakamoto"
              className={inputClass}
              disabled={loading || success}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              <Mail className="h-3 w-3" /> Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="e.g. you@email.com"
              className={inputClass}
              disabled={loading || success}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              <Phone className="h-3 w-3" /> Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(null); }}
              placeholder="e.g. +91 9876543210"
              className={inputClass}
              disabled={loading || success}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSave}
            disabled={isDisabled}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--orbit-accent)] px-4 py-3.5 font-display text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_var(--orbit-accent-soft)] overflow-hidden"
          >
            {success ? (
              <><CheckCircle2 className="h-4 w-4" /> Profile Saved — Launching Orbit</>
            ) : loading ? (
              "Saving..."
            ) : (
              "Save & Enter Orbit"
            )}
          </button>

          <p className="text-center font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
            Profile completion is required to use Orbit
          </p>
        </div>
      </motion.div>
    </div>
  );
}
