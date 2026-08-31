import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/orbit/TopNav";
import { StakingTab } from "@/components/orbit/StakingTab";
import { useWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/staking")({
  head: () => ({
    meta: [{ title: "Orbit · Liquidity Mining & Staking" }],
  }),
  component: StakingPage,
});

function StakingPage() {
  const { address, balance } = useWallet();

  return (
    <div className="min-h-screen bg-[var(--orbit-bg)] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] font-sans text-[var(--orbit-ink)]">
      <TopNav inApp={true} />
      <main className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <StakingTab address={address} walletBalance={balance?.xlm ?? null} />
      </main>
    </div>
  );
}
