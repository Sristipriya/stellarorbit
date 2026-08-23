import { useMemo, useState, useEffect } from "react";
import {
  deposit,
  zapDeposit,
  quoteSharesForDeposit,
  recordPosition,
  type VaultState,
} from "@/lib/stellar/vault";
import {
  stroopsToXlm,
  STROOPS_PER_XLM,
  ORBIT_VAULT_CONTRACT_ID,
  ORBIT_USDC_CONTRACT_ID,
  ORBIT_ZAP_ROUTER_ID,
  ORBIT_POINTS_CONTRACT_ID,
} from "@/lib/stellar/network";
import { classifyError } from "@/lib/stellar/wallet";
import { TxStatus, type TxState } from "./TxStatus";
import { toast } from "sonner";
import { type Notification } from "@/lib/notifications";
import { FiatOnRamp } from "./FiatOnRamp";
import { Zap } from "lucide-react";

export function DepositCard({
  address,
  state,
  walletBalance,
  vaultId,
  assetSymbol,
  onDone,
  onNotify,
}: {
  address: string | null;
  state: VaultState;
  walletBalance: string | null;
  vaultId?: string;
  assetSymbol: string;
  onDone: () => void;
  onNotify?: (n: Omit<Notification, "id" | "at" | "read">) => void;
}) {
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });
  const [raw, setRaw] = useState<string | undefined>();
  const [fiatOpen, setFiatOpen] = useState(false);

  // Zap Mode State
  const [useZap, setUseZap] = useState(false);

  // Referrer tracking
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    // Parse ?ref= from URL
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get("ref");
    if (ref) setReferrer(ref);
  }, []);

  // Determine native asset name based on vaultId
  const isUsdcVault = vaultId === ORBIT_USDC_CONTRACT_ID;
  const nativeAsset = isUsdcVault ? "USDC" : "XLM";
  const zapAsset = isUsdcVault ? "XLM" : "USDC";

  const currentAsset = useZap ? zapAsset : nativeAsset;

  const previewShares = useMemo(() => {
    if (!amount) return 0n;
    try {
      return quoteSharesForDeposit(amount, state);
    } catch {
      return 0n;
    }
  }, [amount, state]);

  // We assume 1:1 price swap mock for demo, so walletBalance check is naive
  const insufficient = Boolean(walletBalance && Number(amount || 0) + 0.5 > Number(walletBalance));

  async function submit() {
    if (!address || !vaultId) return;
    setRaw(undefined);
    setTx({ 
      kind: "pending", 
      label: useZap ? `Signing 2 txs (Approve → Zap)…` : `Depositing ${amount} ${currentAsset}…` 
    });
    try {
      let txHash, sharesMinted, amountStroops;

      if (useZap) {
        // Zap Deposit
        if (!ORBIT_ZAP_ROUTER_ID || !ORBIT_POINTS_CONTRACT_ID) {
          throw new Error("Zap router not deployed");
        }
        // Native asset ID is the vault we are zapping FROM.
        // For the demo, inputTokenId is either USDC or XLM.
        // Here we just pass the dummy zapAsset token ID (using the vault IDs as token IDs for mock).
        const inputTokenId = isUsdcVault ? ORBIT_VAULT_CONTRACT_ID! : ORBIT_USDC_CONTRACT_ID!;
        const shareTokenId = vaultId; // the vault issues its own shares in our current design

        amountStroops = BigInt(Math.floor(Number(amount) * 1e7));

        const res = await zapDeposit(
          address,
          inputTokenId,
          amountStroops,
          vaultId,
          shareTokenId,
          ORBIT_POINTS_CONTRACT_ID,
          ORBIT_ZAP_ROUTER_ID,
          referrer,
        );
        txHash = res.txHash;
        sharesMinted = res.sharesMinted;
      } else {
        // Standard Deposit
        const res = await deposit(address, amount, vaultId ?? "xlm", referrer);
        txHash = res.txHash;
        sharesMinted = res.sharesMinted;
        amountStroops = res.amountStroops;
      }

      const msg = `${Number(amountStroops) / 1e7} ${currentAsset} → ${stroopsToXlm(sharesMinted)} shares`;
      setTx({
        kind: "success",
        title: "Deposited",
        lines: [
          `Amount: ${Number(amountStroops) / 1e7} ${currentAsset}`,
          `Shares minted: ${stroopsToXlm(sharesMinted)}`,
        ],
        txHash,
      });
      setRaw(`tx_hash=${txHash}`);
      setAmount("");
      onDone();

      // Record position entry for P&L tracking
      if (address) {
        const entryPrice =
          state.totalSharesStroops === 0n
            ? STROOPS_PER_XLM
            : (state.totalAssetsStroops * STROOPS_PER_XLM) / state.totalSharesStroops;
        recordPosition(address, entryPrice, sharesMinted, vaultId ?? "xlm");
      }
      toast.success(`Deposited ${Number(amountStroops) / 1e7} ${currentAsset}`, {
        description: `Shares: ${stroopsToXlm(sharesMinted)}`,
      });
      onNotify?.({ kind: "success", title: "Deposit Successful", message: msg, txHash });
    } catch (e) {
      const w = classifyError(e);
      setTx({ kind: "error", title: "Deposit failed", message: w.message });
      setRaw(
        e instanceof Error
          ? (e.stack ?? e.message)
          : typeof e === "object" && e !== null
            ? JSON.stringify(e, Object.getOwnPropertyNames(e))
            : String(e),
      );
      toast.error("Deposit failed", { description: w.message });
      onNotify?.({ kind: "error", title: "Deposit Failed", message: w.message });
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl p-[1px] group transition-all duration-500 hover:shadow-[0_0_40px_-10px_var(--orbit-accent)]">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--orbit-accent)] to-transparent opacity-20 transition-opacity duration-500 group-hover:opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--orbit-accent)] to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-30 group-hover:animate-pulse" />

      {/* Card Content */}
      <div className="relative bg-[#050505]/95 backdrop-blur-xl rounded-[23px] p-6 lg:p-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--orbit-accent)]/10 text-[var(--orbit-accent)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
              </svg>
            </div>
            <h3 className="font-display text-base font-medium tracking-[0.15em] text-[var(--orbit-ink)]">
              Deposit
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFiatOpen(true)}
              className="rounded-full border border-[var(--orbit-edge)] bg-white/5 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--orbit-accent)] hover:bg-[var(--orbit-accent)]/10 transition-colors cursor-pointer"
            >
              Buy Crypto
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--orbit-edge)] bg-[var(--orbit-base)]/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              {currentAsset} <span className="text-[var(--orbit-accent)]">→</span> Shares
            </span>
          </div>
        </div>

        <FiatOnRamp 
          isOpen={fiatOpen} 
          onClose={() => setFiatOpen(false)} 
          address={address} 
        />

        {/* Zap Toggle */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-3 transition-colors">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
            <span className="font-mono text-xs text-[var(--orbit-mute)]">Cross-Asset Zap Deposit</span>
          </div>
          <button
            onClick={() => setUseZap(!useZap)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              useZap ? "bg-[var(--orbit-accent)]" : "bg-[var(--orbit-edge)]"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform ${
                useZap ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <label className="block text-xs font-mono tracking-wider text-[var(--orbit-mute)] mb-3 transition-colors group-hover:text-[var(--orbit-ink)]/70">
            Amount to Deposit ({currentAsset})
          </label>

          <div className="group/input relative flex items-center gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 transition-all duration-300 focus-within:border-[var(--orbit-accent)] focus-within:bg-black/60 focus-within:shadow-[0_0_20px_-5px_var(--orbit-accent)]">
            <input
              id="deposit-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              disabled={tx.kind === "pending"}
              className="w-full bg-transparent font-mono text-3xl outline-none placeholder:text-[var(--orbit-mute)]/30 text-[var(--orbit-ink)] transition-colors disabled:opacity-50"
            />

            <button
              onClick={() =>
                walletBalance && setAmount(Math.max(0, Number(walletBalance) - 1).toFixed(4))
              }
              disabled={tx.kind === "pending"}
              className="shrink-0 rounded-lg border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-accent)] transition-all hover:bg-[var(--orbit-accent)]/20 hover:border-[var(--orbit-accent)]/50 disabled:opacity-40 cursor-pointer"
            >
              Max
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
            <div className="flex justify-between items-center text-[var(--orbit-mute)]">
              <span className="tracking-wider">Wallet Balance</span>
              <span className="text-[var(--orbit-ink)]">
                {walletBalance ? `${Number(walletBalance).toFixed(4)} ${assetSymbol}` : "—"}
              </span>
            </div>

            <div className="h-px w-full bg-[var(--orbit-edge)]/50 my-1" />

            <div className="flex justify-between items-center text-[var(--orbit-mute)]">
              <span className="tracking-wider">You will receive</span>
              <span className="text-[var(--orbit-accent)] font-medium text-xs">
                ≈ {stroopsToXlm(previewShares)} Shares
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!address || !amount || insufficient || tx.kind === "pending"}
          className="group/btn relative mt-8 w-full overflow-hidden rounded-xl bg-[var(--orbit-accent)] px-6 py-4 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-[0_0_30px_var(--orbit-accent-soft)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[100%] transition-transform duration-700 group-hover/btn:translate-x-[100%]" />
          <span className="relative font-display text-sm font-semibold uppercase tracking-[0.2em] text-black">
            {tx.kind === "pending"
              ? (useZap ? "Zapping..." : "Depositing...")
              : insufficient
                ? "Insufficient Balance"
                : useZap
                  ? `Confirm Zap (${currentAsset})`
                  : "Confirm Deposit"}
          </span>
        </button>

        {useZap && (
          <div className="mt-2.5 text-center text-[10px] font-mono text-[var(--orbit-accent)]/80">
            Cross-asset swap enabled · Earns Orbit Points
          </div>
        )}

        {tx.kind !== "idle" && (
          <div className="mt-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <TxStatus state={tx} raw={raw} />
          </div>
        )}
      </div>
    </div>
  );
}
