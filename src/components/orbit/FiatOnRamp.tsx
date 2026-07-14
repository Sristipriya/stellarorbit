import { useState } from "react";
import { initiateSep24Deposit } from "@/lib/stellar/sep24";
import { toast } from "sonner";
import { DollarSign, Loader2, X, ExternalLink } from "lucide-react";

export function FiatOnRamp({
  address,
  isOpen,
  onClose,
}: {
  address: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const handleBuy = async () => {
    if (!address) {
      toast.error("Connect wallet first");
      return;
    }

    setLoading(true);
    try {
      // Default to USDC for Orbit (using testanchor)
      const { url } = await initiateSep24Deposit(address, "SRT", "testanchor.stellar.org");
      
      // Open the interactive URL in a popup
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(url, "FiatOnRamp", `width=${width},height=${height},left=${left},top=${top}`);
      
      toast.success("Anchor popup opened. Complete the flow there.");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Fiat on-ramp failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-md rounded-3xl p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--orbit-mute)] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight">Buy Crypto</h2>
          <p className="text-sm text-[var(--orbit-mute)] mt-1">
            Deposit fiat directly into your Stellar wallet using an official anchor.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--orbit-mute)] mb-1">You pay (USD)</label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-3">
              <DollarSign className="h-5 w-5 text-[var(--orbit-mute)]" />
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="100.00"
                className="w-full bg-transparent font-mono text-xl outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-[var(--orbit-accent)]/10 border border-[var(--orbit-accent)]/30 text-[var(--orbit-accent)]">
            <span>You'll receive ≈</span>
            <span className="font-mono font-bold">{amount ? (Number(amount) * 0.98).toFixed(2) : "0.00"} USDC</span>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading || !amount}
            className="liquid-btn w-full justify-center mt-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Proceed to Provider <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
          
          <p className="text-center text-[10px] text-[var(--orbit-mute)] mt-4">
            This will securely authenticate your wallet via SEP-10 and open a regulated anchor (e.g., testanchor.stellar.org) via SEP-24 to complete payment.
          </p>
        </div>
      </div>
    </div>
  );
}
