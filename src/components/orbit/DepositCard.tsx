import { useMemo, useState } from "react";
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

export function DepositCard({
  address,
  state,
  walletBalance,
  vaultId,
  onDone,
  onNotify,
}: {
  address: string | null;
  state: VaultState;
  walletBalance: string | null;
  vaultId?: string;
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
    setTx({ kind: "pending", label: `Depositing ${amount} ${currentAsset}…` });
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
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Deposit
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFiatOpen(true)}
            className="rounded-md border border-[var(--orbit-edge)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--orbit-accent)] hover:bg-[var(--orbit-accent)]/10"
          >
            Buy Crypto
          </button>
          <span className="font-mono text-[10px] text-[var(--orbit-mute)]">
            {currentAsset} → shares
          </span>
        </div>
      </div>

      <FiatOnRamp 
        isOpen={fiatOpen} 
        onClose={() => setFiatOpen(false)} 
        address={address} 
      />

      {/* Zap Toggle */}
      <div className="mt-4 flex items-center justify-between bg-black/20 p-2 rounded-lg border border-[var(--orbit-edge)]">
        <span className="text-xs text-[var(--orbit-mute)]">⚡ Zap Deposit (Cross-Asset)</span>
        <button
          onClick={() => setUseZap(!useZap)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useZap ? "bg-[var(--orbit-accent)]" : "bg-[var(--orbit-edge)]"}`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform ${useZap ? "translate-x-5" : "translate-x-1"}`}
          />
        </button>
      </div>

      <label className="mt-4 block text-xs text-[var(--orbit-mute)]">Amount ({currentAsset})</label>
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
        className={`liquid-btn mt-4 w-full justify-center ${useZap ? "bg-[var(--orbit-accent)]/20 border-[var(--orbit-accent)]" : ""}`}
      >
        {tx.kind === "pending"
          ? "Signing…"
          : insufficient
            ? "Insufficient balance"
            : useZap
              ? `⚡ Zap ${currentAsset} into Orbit`
              : "Deposit into Orbit"}
      </button>

      {useZap && (
        <div className="mt-2 text-center text-[9px] text-[var(--orbit-accent)]/70">
          Zapping earns Orbit Points! 🏆
        </div>
      )}

      <div className="mt-3">
        <TxStatus state={tx} raw={raw} />
      </div>
    </div>
  );
}
