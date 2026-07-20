import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, ArrowRightLeft, ArrowRight, ShieldAlert, BadgeCent, TrendingUp } from "lucide-react";

export function DefiTab() {
  const [wrapAmount, setWrapAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [lendAmount, setLendAmount] = useState("");

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="font-display text-lg font-bold text-[var(--orbit-ink)]">DeFi Super-Protocol</h2>
        <p className="font-mono text-xs text-[var(--orbit-mute)]">Yield Stripping & P2P Money Market (Testnet)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Yield Tranching Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="orbit-card p-6 border-[var(--orbit-accent)]/20 shadow-[0_0_40px_var(--orbit-accent-soft)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/20">
                <Layers className="h-5 w-5 text-[var(--orbit-accent)]" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">Yield Tranching</h3>
                <p className="font-mono text-[10px] text-[var(--orbit-mute)]">Wrap Orbit Shares into PT + YT</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4">
              <div className="flex justify-between font-mono text-[10px] text-[var(--orbit-mute)] mb-2">
                <span>Amount to Wrap (Orbit Shares)</span>
                <span>Balance: 0.00</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={wrapAmount}
                  onChange={(e) => setWrapAmount(e.target.value)}
                  className="w-full bg-transparent font-display text-2xl font-bold outline-none placeholder:text-[var(--orbit-mute)]/30"
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-mono text-[var(--orbit-mute)]">
                  SHARES
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-black border border-[var(--orbit-edge)] rounded-full p-2">
                <ArrowRightLeft className="h-4 w-4 text-[var(--orbit-accent)] rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4 text-center">
                <div className="font-mono text-[10px] text-[var(--orbit-mute)] mb-1">You Receive</div>
                <div className="font-display text-xl font-bold text-[var(--orbit-ink)]">{wrapAmount || "0.00"}</div>
                <div className="font-mono text-[10px] font-bold text-[var(--orbit-accent)]">PT (Principal)</div>
              </div>
              <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-4 text-center">
                <div className="font-mono text-[10px] text-[var(--orbit-mute)] mb-1">You Receive</div>
                <div className="font-display text-xl font-bold text-[var(--orbit-ink)]">{wrapAmount || "0.00"}</div>
                <div className="font-mono text-[10px] font-bold text-[var(--orbit-ok)]">YT (Yield)</div>
              </div>
            </div>

            <button className="orbit-btn orbit-btn-primary w-full mt-4" disabled={!wrapAmount || Number(wrapAmount) <= 0}>
              Wrap Shares <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </motion.div>

        {/* P2P Lending Market Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="orbit-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-ok)]/20">
              <BadgeCent className="h-5 w-5 text-[var(--orbit-ok)]" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">P2P Lending Market</h3>
              <p className="font-mono text-[10px] text-[var(--orbit-mute)]">Borrow USDC against PT/YT collateral</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Lend Section */}
            <div className="rounded-xl border border-[var(--orbit-edge)] p-4 bg-white/[0.01]">
              <h4 className="font-display text-sm font-semibold mb-3">Lend USDC</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="USDC Amount"
                  value={lendAmount}
                  onChange={(e) => setLendAmount(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--orbit-edge)] bg-white/[0.03] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--orbit-ok)]"
                />
                <button className="orbit-btn border border-[var(--orbit-ok)]/50 text-[var(--orbit-ok)] hover:bg-[var(--orbit-ok)]/10" disabled={!lendAmount}>
                  Create Offer
                </button>
              </div>
            </div>

            {/* Borrow Section */}
            <div className="rounded-xl border border-[var(--orbit-edge)] p-4 bg-white/[0.01]">
              <h4 className="font-display text-sm font-semibold mb-3 flex items-center justify-between">
                <span>Active Offers</span>
                <span className="font-mono text-[9px] bg-[var(--orbit-ok)]/20 text-[var(--orbit-ok)] px-2 py-0.5 rounded-full">3 Live</span>
              </h4>
              
              <div className="space-y-2">
                {/* Mock Offer 1 */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--orbit-edge)] bg-black/40 hover:border-[var(--orbit-accent)]/50 transition-colors">
                  <div>
                    <div className="font-mono text-xs font-bold">1,000 USDC</div>
                    <div className="font-mono text-[9px] text-[var(--orbit-mute)] mt-0.5">@ 5% APY • 30 Days</div>
                  </div>
                  <button className="orbit-btn orbit-btn-primary px-3 py-1.5 text-[10px]">
                    Borrow
                  </button>
                </div>
                {/* Mock Offer 2 */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--orbit-edge)] bg-black/40 hover:border-[var(--orbit-accent)]/50 transition-colors">
                  <div>
                    <div className="font-mono text-xs font-bold">500 USDC</div>
                    <div className="font-mono text-[9px] text-[var(--orbit-mute)] mt-0.5">@ 4.5% APY • 14 Days</div>
                  </div>
                  <button className="orbit-btn orbit-btn-primary px-3 py-1.5 text-[10px]">
                    Borrow
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-[var(--orbit-warn)]/10 border border-[var(--orbit-warn)]/20">
              <ShieldAlert className="h-4 w-4 text-[var(--orbit-warn)] shrink-0 mt-0.5" />
              <p className="font-mono text-[9px] text-[var(--orbit-warn)]">
                Borrowing requires locking PT or YT tokens as collateral. If your collateral value drops below the maintenance margin, your position may be liquidated.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
