import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { EtherealShadow } from "@/components/ui/etheral-shadow";
import { TopNav } from "@/components/orbit/TopNav";
import { WalletButton } from "@/components/orbit/WalletButton";
import { NavPanel } from "@/components/orbit/NavPanel";
import { PositionCard } from "@/components/orbit/PositionCard";
import { DepositCard } from "@/components/orbit/DepositCard";
import { WithdrawCard } from "@/components/orbit/WithdrawCard";
import { ActivityFeed } from "@/components/orbit/ActivityFeed";
import { FundBanner } from "@/components/orbit/FundBanner";
import { useWallet } from "@/hooks/use-wallet";
import { useVault } from "@/hooks/use-vault";
import { HAS_REAL_CONTRACT } from "@/lib/stellar/network";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Orbit · Vault Dashboard" },
      {
        name: "description",
        content:
          "Deposit, withdraw, and track your position in the Orbit index vault on Stellar Testnet.",
      },
      { property: "og:title", content: "Orbit · Vault Dashboard" },
      {
        property: "og:description",
        content: "Soroban-powered index vault dashboard on Stellar Testnet.",
      },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const wallet = useWallet();
  const vault = useVault(wallet.address);
  const showFundBanner = wallet.address && wallet.balance && !wallet.balance.funded;

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <EtherealShadow
          color="rgba(140, 200, 255, 0.55)"
          animation={{ scale: 50, speed: 40 }}
          noise={{ opacity: 0.35, scale: 1.1 }}
          sizing="fill"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />
      </div>
      <TopNav inApp />
      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Orbit Vault
            </motion.h1>
            <p className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">
              {HAS_REAL_CONTRACT
                ? "Soroban contract · Testnet"
                : "Demo mode · real Testnet payments + local share ledger until contract ID is configured"}
            </p>
          </div>
          <WalletButton
            address={wallet.address}
            loading={wallet.loading}
            error={wallet.error}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
        </div>

        {showFundBanner && wallet.address && (
          <div className="mt-6">
            <FundBanner
              address={wallet.address}
              onFunded={() => wallet.refreshBalance(wallet.address!)}
            />
          </div>
        )}

        {!wallet.address && (
          <div className="mt-10 grid place-items-center">
            <div className="glass max-w-md rounded-2xl p-8 text-center">
              <div className="font-display text-xl">Connect a Stellar wallet</div>
              <p className="mt-2 text-sm text-[var(--orbit-mute)]">
                Orbit supports Freighter, Albedo, xBull, and Lobstr on Stellar Testnet. New accounts
                can fund themselves with Friendbot.
              </p>
              <button onClick={wallet.connect} className="liquid-btn mt-5">
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {wallet.address && (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <NavPanel state={vault.state} loading={vault.loading} />
              <PositionCard
                address={wallet.address}
                state={vault.state}
                xlmBalance={wallet.balance?.xlm ?? null}
              />
              <ActivityFeed events={vault.events} />
            </div>
            <div className="space-y-4">
              <DepositCard
                address={wallet.address}
                state={vault.state}
                walletBalance={wallet.balance?.xlm ?? null}
                onDone={vault.refresh}
              />
              <WithdrawCard address={wallet.address} state={vault.state} onDone={vault.refresh} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
