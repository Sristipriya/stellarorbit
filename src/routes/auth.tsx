import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useWallet } from '@/hooks/use-wallet';
import { OrbitLogo } from '@/components/orbit/OrbitLogo';
import { Wallet, ShieldCheck, Zap, Activity, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fundWithFriendbot } from '@/lib/stellar/friendbot';
import { fetchXlmBalance } from '@/lib/stellar/balance';
import { ShaderBackground } from '@/components/ui/animated-shader-hero';

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
    <div className="relative min-h-screen flex flex-col justify-between">
      <ShaderBackground />
      
      {/* Top Bar with Logo and Return to Landing */}
      <div className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <OrbitLogo size={32} />
          <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-[var(--orbit-accent)] transition-colors">
            orbit
          </span>
        </Link>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--orbit-mute)] hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Branding & Value Prop */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-3.5 py-1 font-mono text-xs text-[var(--orbit-accent)] backdrop-blur-sm">
              Web3 Onboarding · Stellar Testnet
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-display font-bold leading-tight text-white">
                Institutional-Grade <br/>
                <span className="text-[var(--orbit-accent)]">DeFi Yield</span>
              </h2>
              <p className="text-base sm:text-lg text-[var(--orbit-mute)] font-mono max-w-md leading-relaxed">
                Access curated auto-compounding strategy vaults and peer-to-peer money markets on Stellar. 
              </p>
            </div>

            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4">
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-md">
                  <ShieldCheck className="w-5 h-5 text-[var(--orbit-ok)]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">Secure Non-Custodial Vaults</h3>
                  <p className="text-[var(--orbit-mute)] text-xs font-mono">100% on-chain Soroban smart contracts with verifiable NAV.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-md">
                  <Zap className="w-5 h-5 text-[var(--orbit-accent)]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">Automated Testnet Funding</h3>
                  <p className="text-[var(--orbit-mute)] text-xs font-mono">New wallets are automatically funded with testnet XLM on connect.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-md">
                  <Activity className="w-5 h-5 text-[#9d4edd]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">Auto-Compounding & Tranches</h3>
                  <p className="text-[var(--orbit-mute)] text-xs font-mono">Earn automated yields or tokenize into Principal & Yield tokens.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="p-8 sm:p-10 bg-black/60 backdrop-blur-2xl border border-white/15 rounded-3xl relative overflow-hidden shadow-2xl shadow-black/80">
            {/* Subtle radial glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--orbit-accent)]/15 rounded-full blur-[90px] -z-10 pointer-events-none" />
            
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">Connect to Orbit</h2>
                <p className="text-[var(--orbit-mute)] text-sm font-mono">Connect your Web3 wallet to start earning yield</p>
              </div>

              {funding ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-12 h-12 border-3 border-[var(--orbit-accent)] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-white font-semibold text-base">Initializing Account</p>
                    <p className="text-[var(--orbit-mute)] text-xs font-mono">Funding your wallet with Testnet XLM via Friendbot...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <button
                    onClick={connect}
                    disabled={loading}
                    className="w-full liquid-btn py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-display font-semibold text-base sm:text-lg transition-transform active:scale-[0.98] shadow-lg shadow-[var(--orbit-accent)]/20 cursor-pointer"
                  >
                    <Wallet className="w-5 h-5" />
                    {loading ? 'Connecting...' : 'Connect Stellar Wallet'}
                  </button>
                  <div className="text-center pt-2">
                    <p className="text-xs text-[var(--orbit-mute)] font-mono">
                      Supported wallets: <span className="text-white/80">Freighter</span>, <span className="text-white/80">Albedo</span>, <span className="text-white/80">Lobstr</span>, <span className="text-white/80">xBull</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="relative z-10 py-4 text-center text-xs font-mono text-[var(--orbit-mute)]/60">
        Orbit Protocol · Stellar Testnet · Soroban Smart Contracts
      </div>
    </div>
  );
}

