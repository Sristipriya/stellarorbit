import { Link } from "@tanstack/react-router";
import { OrbitLogo } from "@/components/orbit/OrbitLogo";
import { useWallet } from "@/hooks/use-wallet";
import { shortAddr } from "@/lib/stellar/network";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function TopNav({ inApp = false }: { inApp?: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <OrbitLogo size={28} className="transition-transform group-hover:rotate-12" />
          <span className="font-display text-xl font-semibold tracking-tight">orbit</span>
          <span className="ml-2 rounded-full border border-[var(--orbit-edge)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
            testnet
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[var(--orbit-mute)] md:flex">
          <Link to="/" className="hover:text-[var(--orbit-ink)]">
            Home
          </Link>
          <Link to="/analytics" className="hover:text-[var(--orbit-ink)]">
            Analytics
          </Link>
          <a
            href="https://developers.stellar.org/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--orbit-ink)]"
          >
            Docs
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--orbit-ink)]"
          >
            GitHub
          </a>
        </nav>
        {!inApp ? (
          <Link to="/app" className="liquid-btn text-sm">
            Enter App
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/" className="liquid-btn-ghost hidden text-sm md:block">
              ← Home
            </Link>
            <WalletButton />
          </div>
        )}
      </div>
    </header>
  );
}

function WalletButton() {
  const { address, balance, connect, disconnect, loading } = useWallet();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="brutalist-button px-4 py-2 text-sm opacity-50">
        Connecting...
      </div>
    );
  }

  if (!address) {
    return (
      <button onClick={connect} className="brutalist-button px-4 py-2 text-sm font-bold bg-white text-black hover:bg-neutral-200">
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="brutalist-card flex items-center gap-2 px-3 py-1.5 text-sm font-mono hover:bg-white/5"
      >
        <div className="h-2 w-2 rounded-full bg-[var(--orbit-ok)] shadow-[0_0_8px_var(--orbit-ok)]" />
        {shortAddr(address)}
      </button>

      {open && (
        <div className="brutalist-card absolute right-0 mt-2 w-48 flex flex-col p-2 z-50">
          <div className="px-2 py-2 text-xs font-mono text-[var(--orbit-mute)] border-b border-[var(--orbit-edge)] mb-2">
            Balance: {balance?.xlm ? `${Number(balance.xlm).toFixed(2)} XLM` : "..."}
          </div>
          <button 
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex items-center justify-between px-2 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded"
          >
            Disconnect
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
