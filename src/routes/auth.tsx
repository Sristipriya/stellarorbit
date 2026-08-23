
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useWallet } from '@/hooks/use-wallet';
import { OrbitLogo } from '@/components/orbit/OrbitLogo';
import { Wallet, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fundWithFriendbot } from '@/lib/stellar/friendbot';
import { fetchXlmBalance } from '@/lib/stellar/balance';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

function AuthPage() {
  const { address, connect, loading } = useWallet();
  const navigate = useNavigate();
  const [funding, setFunding] = useState(false);

  // If already connected and funded, redirect to /app
  useEffect(() => {
    if (address && !funding) {
      checkAndFund(address);
    }
  }, [address]);

  async function checkAndFund(addr: string) {
    setFunding(true);
    const bal = await fetchXlmBalance(addr);
    
    if (!bal.funded) {
      // Automatically fund the new wallet
      await fundWithFriendbot(addr);
    }
    
    navigate({ to: '/app' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left: Branding & Value Prop */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <OrbitLogo size={40} />
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">orbit</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-medium leading-tight text-white">
              Institutional-Grade <br/>
              <span className="text-[var(--orbit-accent)]">DeFi Yield</span>
            </h2>
            <p className="text-lg text-[var(--orbit-mute)] font-mono max-w-md">
              Access curated auto-compounding strategy vaults on the Stellar network. 
            </p>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/5 p-3 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-[var(--orbit-ok)]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Secure by Design</h3>
                <p className="text-[var(--orbit-mute)] text-sm font-mono">Non-custodial vaults audited by industry leaders.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/5 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-[var(--orbit-accent)]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">1-Click Zaps</h3>
                <p className="text-[var(--orbit-mute)] text-sm font-mono">Instantly convert any asset into vault-native shares.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/5 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-[#9d4edd]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Auto-Compounding</h3>
                <p className="text-[var(--orbit-mute)] text-sm font-mono">Yield is automatically harvested and reinvested.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="brutalist-card p-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--orbit-accent)]/10 rounded-full blur-[80px] -z-10" />
          
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-display font-semibold text-white mb-2">Welcome to Orbit</h2>
              <p className="text-[var(--orbit-mute)] text-sm font-mono">Connect your Web3 wallet to continue</p>
            </div>

            {funding ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-2 border-[var(--orbit-accent)] border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-white font-semibold">Initializing Wallet</p>
                  <p className="text-[var(--orbit-mute)] text-xs font-mono mt-1">Funding your new account with Testnet XLM...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={connect}
                  disabled={loading}
                  className="w-full btn-primary py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-display font-semibold text-lg transition-transform active:scale-[0.98]"
                >
                  <Wallet className="w-5 h-5" />
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--orbit-mute)] font-mono">
                    Don't have a wallet? Install <a href="https://freighter.app" target="_blank" className="text-[var(--orbit-accent)] hover:underline">Freighter</a> or <a href="https://albedo.link" target="_blank" className="text-[var(--orbit-accent)] hover:underline">Albedo</a>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
