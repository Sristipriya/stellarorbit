import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { shortAddr } from "@/lib/stellar/network";
import type { WalletError } from "@/lib/stellar/wallet";

type Props = {
  address: string | null;
  loading: boolean;
  error: WalletError | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function WalletButton({ address, loading, error, onConnect, onDisconnect }: Props) {
  const [open, setOpen] = useState(false);

  if (!address) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button onClick={onConnect} disabled={loading} className="liquid-btn text-sm">
          {loading ? "Opening wallets…" : "Connect Wallet"}
        </button>
        {error && (
          <span className="font-mono text-[10px] text-[var(--orbit-danger)]">{error.message}</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="liquid-btn-ghost text-sm">
        <span className="h-2 w-2 rounded-full bg-[var(--orbit-ok)] shadow-[0_0_10px_var(--orbit-ok)]" />
        <span className="font-mono">{shortAddr(address)}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass absolute right-0 mt-2 w-72 rounded-2xl p-3"
          >
            <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
              Connected
            </div>
            <div className="break-all rounded-lg bg-black/30 p-2 font-mono text-xs">{address}</div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(address)}
                className="flex-1 rounded-lg border border-[var(--orbit-edge)] px-3 py-2 text-xs hover:bg-white/5"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onDisconnect();
                }}
                className="flex-1 rounded-lg border border-[var(--orbit-edge)] px-3 py-2 text-xs text-[var(--orbit-danger)] hover:bg-white/5"
              >
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
