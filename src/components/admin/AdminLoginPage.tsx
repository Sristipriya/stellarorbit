import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { adminLogin } from "@/lib/admin-auth";

export function AdminLoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const ok = adminLogin(user.trim(), pass);
      if (ok) {
        onSuccess();
      } else {
        setError("Invalid credentials. Check VITE_ADMIN_USER and VITE_ADMIN_PASS.");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20 border border-[var(--orbit-accent)]/30">
            <Globe className="h-7 w-7 text-[var(--orbit-accent)]" />
          </div>
          <div className="font-display text-2xl font-semibold">Orbit Admin</div>
          <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
            Analytics & Monitoring · Stellar Testnet
          </div>
        </div>

        <form onSubmit={submit} className="glass rounded-2xl p-7 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
              Username
            </label>
            <input
              id="admin-user"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="admin"
              required
              className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 font-mono text-sm outline-none focus:border-[var(--orbit-accent)] transition-colors text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)]"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-pass"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 pr-10 font-mono text-sm outline-none focus:border-[var(--orbit-accent)] transition-colors text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)]"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-danger)]/30 bg-[var(--orbit-danger)]/10 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--orbit-danger)]" />
              <span className="font-mono text-xs text-[var(--orbit-danger)]">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !user || !pass}
            className="liquid-btn w-full justify-center"
          >
            <Lock className="h-4 w-4" />
            {loading ? "Authenticating…" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center font-mono text-[10px] text-[var(--orbit-mute)]">
          Default: admin / orbit2024 · Set VITE_ADMIN_USER + VITE_ADMIN_PASS in .env
        </div>
      </motion.div>
    </div>
  );
}
