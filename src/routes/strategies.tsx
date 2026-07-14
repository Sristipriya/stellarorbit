import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/orbit/TopNav";
import { StrategyMarketplace } from "@/components/orbit/StrategyMarketplace";
import { useWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/strategies")({
  head: () => ({
    meta: [{ title: "Orbit · Strategies Marketplace" }],
  }),
  component: StrategiesPage,
});

function StrategiesPage() {
  return (
    <div className="min-h-screen bg-[var(--orbit-bg)] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] font-sans text-[var(--orbit-ink)]">
      <TopNav inApp={true} />
      <main className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
        <StrategyMarketplace />
      </main>
    </div>
  );
}
