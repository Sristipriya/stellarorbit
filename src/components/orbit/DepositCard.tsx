import { useMemo, useState } from "react";
import { deposit, quoteSharesForDeposit, type VaultState } from "@/lib/stellar/vault";
import { stroopsToXlm } from "@/lib/stellar/network";
import { classifyError } from "@/lib/stellar/wallet";
import { TxStatus, type TxState } from "./TxStatus";
import { toast } from "sonner";
import { type Notification } from "@/lib/notifications";

export function DepositCard({
  address,
  state,
  walletBalance,
  onDone,
  onNotify,
}: {
  address: string | null;
  state: VaultState;
  walletBalance: string | null;
  onDone: () => void;
  onNotify?: (n: Omit<Notification, "id" | "at" | "read">) => void;
}) {
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });
  const [raw, setRaw] = useState<string | undefined>();

  const previewShares = useMemo(() => {
    if (!amount) return 0n;
    try {
      return quoteSharesForDeposit(amount, state);
    } catch {
      return 0n;
    }
  }, [amount, state]);

  const insufficient = Boolean(walletBalance && Number(amount || 0) + 0.5 > Number(walletBalance));

  async function submit() {
    if (!address) return;
    setRaw(undefined);
    setTx({ kind: "pending", label: `Depositing ${amount} XLM…` });
    try {
      const { txHash, sharesMinted, amountStroops } = await deposit(address, amount);
      const msg = `${stroopsToXlm(amountStroops)} XLM → ${stroopsToXlm(sharesMinted)} shares`;
      setTx({
        kind: "success",
        title: "Deposited",
        lines: [
          `Amount: ${stroopsToXlm(amountStroops)} XLM`,
          `Shares minted: ${stroopsToXlm(sharesMinted)}`,
        ],
        txHash,
      });
      setRaw(`tx_hash=${txHash}`);
      setAmount("");
      onDone();
      toast.success(`Deposited ${stroopsToXlm(amountStroops)} XLM`, {
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
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Deposit
        </h3>
        <span className="font-mono text-[10px] text-[var(--orbit-mute)]">XLM → shares</span>
      </div>
      <label className="mt-4 block text-xs text-[var(--orbit-mute)]">Amount (XLM)</label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 focus-within:border-[var(--orbit-accent)]">
        <input
          id="deposit-amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          disabled={tx.kind === "pending"}
          className="w-full bg-transparent font-mono text-2xl outline-none placeholder:text-[var(--orbit-mute)] disabled:opacity-50"
        />
        <button
          onClick={() =>
            walletBalance && setAmount(Math.max(0, Number(walletBalance) - 1).toFixed(4))
          }
          disabled={tx.kind === "pending"}
          className="rounded-md border border-[var(--orbit-edge)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] disabled:opacity-40"
        >
          max
        </button>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-[var(--orbit-mute)]">
        <span>
          You'll receive ≈{" "}
          <span className="text-[var(--orbit-accent)]">{stroopsToXlm(previewShares)} shares</span>
        </span>
        {walletBalance && <span>Wallet: {Number(walletBalance).toFixed(4)} XLM</span>}
      </div>
      <button
        onClick={submit}
        disabled={!address || !amount || insufficient || tx.kind === "pending"}
        className="liquid-btn mt-4 w-full justify-center"
      >
        {tx.kind === "pending"
          ? "Signing…"
          : insufficient
            ? "Insufficient balance"
            : "Deposit into Orbit"}
      </button>
      <div className="mt-3">
        <TxStatus state={tx} raw={raw} />
      </div>
    </div>
  );
}
