import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { VaultHealthCard } from "@/components/admin/VaultHealthCard";
import { useVault } from "@/hooks/use-vault";
import { checkRpcHealth, type HealthResult } from "@/lib/stellar/health";
import { RefreshCcw, Info, Zap } from "lucide-react";
import { harvest } from "@/lib/stellar/vault";
import { useWallet } from "@/hooks/use-wallet";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Orbit Admin — Settings" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const vault = useVault(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [yieldAmount, setYieldAmount] = useState("50");
  const [harvesting, setHarvesting] = useState(false);
  const { address } = useWallet();

  useEffect(() => {
    setAuthed(isAdminAuthenticated());
  }, []);

  async function pingRpc() {
    setChecking(true);
    const h = await checkRpcHealth();
    setHealth(h);
    setChecking(false);
  }

  useEffect(() => {
    void pingRpc();
  }, []);

  if (!authed) return <AdminLoginPage onSuccess={() => setAuthed(true)} />;

  async function handleHarvest() {
    if (!address) {
      toast.error("Wallet disconnected", { description: "Please connect the Admin wallet first." });
      return;
    }
    setHarvesting(true);
    try {
      const { txHash } = await harvest(address, yieldAmount);
      toast.success("Yield Injected!", {
        description: `Successfully added ${yieldAmount} XLM profit to the vault.`,
      });
      console.log("Harvest TX:", txHash);
      vault.refresh();
    } catch (err: any) {
      toast.error("Harvest Failed", { description: err.message || String(err) });
    } finally {
      setHarvesting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-semibold">System Settings</h1>
          <p className="font-mono text-xs text-[var(--orbit-mute)] mt-1">
            Network configuration · RPC health · Contract details
          </p>
        </div>

        {/* RPC health */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
              RPC Health Check
            </h3>
            <button
              onClick={pingRpc}
              disabled={checking}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
              Ping Now
            </button>
          </div>
          {health ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Status",
                  value: health.status.toUpperCase(),
                  color:
                    health.status === "ok"
                      ? "text-[var(--orbit-ok)]"
                      : health.status === "slow"
                        ? "text-[var(--orbit-warn)]"
                        : "text-[var(--orbit-danger)]",
                },
                {
                  label: "Latency",
                  value: health.latencyMs != null ? `${health.latencyMs}ms` : "—",
                  color: "text-[var(--orbit-ink)]",
                },
                {
                  label: "Latest Ledger",
                  value: health.ledger != null ? `#${health.ledger.toLocaleString()}` : "—",
                  color: "text-[var(--orbit-ink)]",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border border-[var(--orbit-edge)] bg-black/20 p-3"
                >
                  <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1">
                    {c.label}
                  </div>
                  <div className={`font-display text-lg font-semibold ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-xs text-[var(--orbit-mute)]">Checking…</div>
          )}
        </div>

        <VaultHealthCard state={vault.state} />

        {/* Live Presentation Tools */}
        <div className="glass rounded-2xl p-5 border border-[var(--orbit-accent)]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Zap className="w-24 h-24 text-[var(--orbit-accent)]" />
          </div>
          <div className="relative">
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-accent)] mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Live Presentation Tools
            </h3>
            <p className="font-mono text-xs text-[var(--orbit-mute)] mb-4 max-w-sm">
              Instantly inject simulated profit (XLM) into the vault to demonstrate yield generation and share price growth live.
            </p>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <input
                  type="number"
                  value={yieldAmount}
                  onChange={(e) => setYieldAmount(e.target.value)}
                  className="w-32 bg-black/40 border border-[var(--orbit-edge)] rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-[var(--orbit-accent)]"
                  placeholder="Amount"
                  min="1"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-[var(--orbit-mute)]">
                  XLM
                </span>
              </div>
              <button
                onClick={handleHarvest}
                disabled={harvesting || !address || !yieldAmount}
                className="btn-primary py-2 px-4 rounded-xl font-display font-semibold text-sm disabled:opacity-50"
              >
                {harvesting ? "Injecting..." : "Inject Yield"}
              </button>
            </div>
            {!address && (
              <p className="text-[10px] text-[var(--orbit-warn)] mt-2 font-mono">
                * Please connect your Admin wallet in the sidebar to sign this transaction.
              </p>
            )}
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.02] p-5">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--orbit-mute)]" />
          <div>
            <div className="font-display text-sm font-semibold mb-1">Admin Notes</div>
            <p className="font-mono text-xs text-[var(--orbit-mute)] leading-relaxed">
              This admin panel reads live data from the Stellar Testnet. No write operations are
              performed here. To change contract parameters, use the stellar-cli scripts in{" "}
              <code className="text-[var(--orbit-accent)]">scripts/</code>. Admin credentials are
              set via <code className="text-[var(--orbit-accent)]">VITE_ADMIN_USER</code> and{" "}
              <code className="text-[var(--orbit-accent)]">VITE_ADMIN_PASS</code> in your{" "}
              <code className="text-[var(--orbit-accent)]">.env</code> file.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
