import { useState } from "react";
import { toast } from "sonner";
import { fundWithFriendbot } from "@/lib/stellar/friendbot";

export function FundBanner({ address, onFunded }: { address: string; onFunded: () => void }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const r = await fundWithFriendbot(address);
    setLoading(false);
    if (r.ok) {
      toast.success("Funded by Friendbot", { description: "10,000 XLM credited on Testnet." });
      onFunded();
    } else {
      toast.error("Friendbot failed", { description: r.error });
    }
  }
  return (
    <div className="glass flex items-center justify-between gap-4 rounded-2xl p-4">
      <div>
        <div className="font-display text-sm">Your Testnet account is empty.</div>
        <div className="font-mono text-xs text-[var(--orbit-mute)]">Fund it with Friendbot to start using Orbit.</div>
      </div>
      <button onClick={go} disabled={loading} className="liquid-btn text-sm">
        {loading ? "Funding…" : "Fund with Friendbot"}
      </button>
    </div>
  );
}