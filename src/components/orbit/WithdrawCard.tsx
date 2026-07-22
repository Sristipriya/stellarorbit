import { useMemo, useState } from "react";
import { withdraw, quoteAssetsForShares, type VaultState } from "@/lib/stellar/vault";
import { stroopsToXlm } from "@/lib/stellar/network";
import { classifyError } from "@/lib/stellar/wallet";
import { TxStatus, type TxState } from "./TxStatus";
import { toast } from "sonner";
import { type Notification } from "@/lib/notifications";

export function WithdrawCard({
  address,
  state,
  vaultId,
  onDone,
  onNotify,
}: {
  address: string | null;
  state: VaultState;
  vaultId?: string;
  onDone: () => void;
  onNotify?: (n: Omit<Notification, "id" | "at" | "read">) => void;
}) {
  const [shares, setShares] = useState("");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });
  const [raw, setRaw] = useState<string | undefined>();

  const previewAssets = useMemo(() => {
    if (!shares) return 0n;
    try {
      return quoteAssetsForShares(shares, state);
    } catch {
      return 0n;
    }
  }, [shares, state]);

  const tooMany = useMemo(() => {
    if (!shares) return false;
    try {
      const s = BigInt(Math.round(Number(shares) * 1e7));
      return s > state.userSharesStroops;
    } catch {
      return false;
    }
  }, [shares, state.userSharesStroops]);

  async function submit() {
    if (!address) return;
    setRaw(undefined);
    setTx({ kind: "pending", label: `Withdrawing ${shares} shares…` });
    try {
      const { txHash, assetsOut, sharesBurned } = await withdraw(address, shares, vaultId ?? "xlm");
      const msg = `${stroopsToXlm(sharesBurned)} shares → ${stroopsToXlm(assetsOut)} XLM`;
      setTx({
        kind: "success",
        title: "Withdrawn",
        lines: [
          `Shares burned: ${stroopsToXlm(sharesBurned)}`,
          `Assets out: ${stroopsToXlm(assetsOut)} XLM`,
        ],
        txHash,
      });
      setRaw(`tx_hash=${txHash}`);
      setShares("");
      onDone();
      toast.success(`Withdrew ${stroopsToXlm(assetsOut)} XLM`, {
        description: `Shares burned: ${stroopsToXlm(sharesBurned)}`,
      });
      onNotify?.({ kind: "success", title: "Withdrawal Successful", message: msg, txHash });
    } catch (e) {
      const w = classifyError(e);
      setTx({ kind: "error", title: "Withdraw failed", message: w.message });
      setRaw(
        e instanceof Error
          ? (e.stack ?? e.message)
          : typeof e === "object" && e !== null
            ? JSON.stringify(e, Object.getOwnPropertyNames(e))
            : String(e),
      );
      toast.error("Withdraw failed", { description: w.message });
      onNotify?.({ kind: "error", title: "Withdrawal Failed", message: w.message });
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl p-[1px] group transition-all duration-500 hover:shadow-[0_0_40px_-10px_var(--orbit-warn)]">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--orbit-warn)] to-transparent opacity-20 transition-opacity duration-500 group-hover:opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--orbit-warn)] to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-30 group-hover:animate-pulse" />
      
      {/* Card Content */}
      <div className="relative bg-[#050505]/95 backdrop-blur-xl rounded-[23px] p-6 lg:p-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--orbit-warn)]/10 text-[var(--orbit-warn)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
              </svg>
            </div>
            <h3 className="font-display text-base font-medium tracking-[0.15em] text-[var(--orbit-ink)]">
              Withdraw
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--orbit-edge)] bg-[var(--orbit-base)]/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
            Shares <span className="text-[var(--orbit-warn)]">→</span> XLM
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <label className="block text-xs font-mono tracking-wider text-[var(--orbit-mute)] mb-3 transition-colors group-hover:text-[var(--orbit-ink)]/70">
            Amount to Burn
          </label>
          
          <div className="group/input relative flex items-center gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 transition-all duration-300 focus-within:border-[var(--orbit-warn)] focus-within:bg-black/60 focus-within:shadow-[0_0_20px_-5px_var(--orbit-warn)]">
            <input
              id="withdraw-shares"
              inputMode="decimal"
              placeholder="0.00"
              value={shares}
              onChange={(e) => setShares(e.target.value.replace(/[^0-9.]/g, ""))}
              disabled={tx.kind === "pending"}
              className="w-full bg-transparent font-mono text-3xl outline-none placeholder:text-[var(--orbit-mute)]/30 text-[var(--orbit-ink)] transition-colors disabled:opacity-50"
            />
            
            <button
              onClick={() => setShares(stroopsToXlm(state.userSharesStroops))}
              disabled={tx.kind === "pending"}
              className="shrink-0 rounded-lg border border-[var(--orbit-warn)]/30 bg-[var(--orbit-warn)]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-warn)] transition-all hover:bg-[var(--orbit-warn)]/20 hover:border-[var(--orbit-warn)]/50 disabled:opacity-40"
            >
              Max
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
            <div className="flex justify-between items-center text-[var(--orbit-mute)]">
              <span className="tracking-wider">Available Shares</span>
              <span className="text-[var(--orbit-ink)]">{stroopsToXlm(state.userSharesStroops)}</span>
            </div>
            
            <div className="h-px w-full bg-[var(--orbit-edge)]/50 my-1" />
            
            <div className="flex justify-between items-center text-[var(--orbit-mute)]">
              <span className="tracking-wider">You will receive</span>
              <span className="text-[var(--orbit-warn)] font-medium text-xs">
                ≈ {stroopsToXlm(previewAssets)} XLM
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!address || !shares || tooMany || tx.kind === "pending"}
          className="group/btn relative mt-8 w-full overflow-hidden rounded-xl bg-[var(--orbit-warn)] px-6 py-4 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] transition-transform duration-700 group-hover/btn:translate-x-[100%]" />
          <span className="relative font-display text-sm font-semibold uppercase tracking-[0.2em] text-black">
            {tx.kind === "pending"
              ? "Withdrawing..."
              : tooMany
                ? "Insufficient Balance"
                : "Confirm Withdrawal"}
          </span>
        </button>

        {tx.kind !== "idle" && (
          <div className="mt-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <TxStatus state={tx} raw={raw} />
          </div>
        )}
      </div>
    </div>
  );
}
