import { useMemo, useState } from "react";
import { withdraw, quoteAssetsForShares, type VaultState } from "@/lib/stellar/vault";
import { stroopsToXlm } from "@/lib/stellar/network";
import { classifyError } from "@/lib/stellar/wallet";
import { TxStatus, type TxState } from "./TxStatus";

export function WithdrawCard({ address, state, onDone }: { address: string | null; state: VaultState; onDone: () => void }) {
  const [shares, setShares] = useState("");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });
  const [raw, setRaw] = useState<string | undefined>();

  const previewAssets = useMemo(() => {
    if (!shares) return 0n;
    try { return quoteAssetsForShares(shares, state); } catch { return 0n; }
  }, [shares, state]);

  const tooMany = useMemo(() => {
    if (!shares) return false;
    try {
      const s = BigInt(Math.round(Number(shares) * 1e7));
      return s > state.userSharesStroops;
    } catch { return false; }
  }, [shares, state.userSharesStroops]);

  async function submit() {
    if (!address) return;
    setRaw(undefined);
    setTx({ kind: "pending", label: `Withdrawing ${shares} shares…` });
    try {
      const { txHash, assetsOut, sharesBurned } = await withdraw(address, shares);
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
    } catch (e) {
      const w = classifyError(e);
      setTx({ kind: "error", title: "Withdraw failed", message: w.message });
      setRaw(e instanceof Error ? e.stack ?? e.message : String(e));
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">Withdraw</h3>
        <span className="font-mono text-[10px] text-[var(--orbit-mute)]">shares → XLM</span>
      </div>
      <label className="mt-4 block text-xs text-[var(--orbit-mute)]">Shares to burn</label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 focus-within:border-[var(--orbit-accent)]">
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={shares}
          onChange={(e) => setShares(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full bg-transparent font-mono text-2xl outline-none placeholder:text-[var(--orbit-mute)]"
        />
        <button
          onClick={() => setShares(stroopsToXlm(state.userSharesStroops))}
          className="rounded-md border border-[var(--orbit-edge)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)]"
        >max</button>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-[var(--orbit-mute)]">
        <span>You'll receive ≈ <span className="text-[var(--orbit-accent)]">{stroopsToXlm(previewAssets)} XLM</span></span>
        <span>Available: {stroopsToXlm(state.userSharesStroops)}</span>
      </div>
      <button
        onClick={submit}
        disabled={!address || !shares || tooMany || tx.kind === "pending"}
        className="liquid-btn mt-4 w-full justify-center"
        style={{ background: "linear-gradient(180deg, oklch(1 0 0 / 0.08), oklch(1 0 0 / 0.02)), color-mix(in oklab, var(--orbit-warn) 22%, transparent)" }}
      >
        {tx.kind === "pending" ? "Signing…" : tooMany ? "More than you hold" : "Withdraw from Orbit"}
      </button>
      <div className="mt-3"><TxStatus state={tx} raw={raw} /></div>
    </div>
  );
}