import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { ActivityChart } from "@/components/admin/ActivityChart";
import { TransactionTable } from "@/components/admin/TransactionTable";
import { UniqueUsersPanel } from "@/components/admin/UniqueUsersPanel";
import { VaultHealthCard } from "@/components/admin/VaultHealthCard";
import { useVault } from "@/hooks/use-vault";
import { stroopsToXlm } from "@/lib/stellar/network";
import {
  TrendingUp,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Orbit Admin — Dashboard" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const vault = useVault(null);

  useEffect(() => {
    setAuthed(isAdminAuthenticated());
  }, []);

  if (!authed) {
    return <AdminLoginPage onSuccess={() => setAuthed(true)} />;
  }

  const events = vault.events;
  const deposits = events.filter((e) => e.kind === "deposit");
  const withdrawals = events.filter((e) => e.kind === "withdraw");
  const uniqueUsers = new Set(events.map((e) => e.address)).size;
  const totalDepVol = deposits.reduce((s, e) => s + e.amountStroops, 0n);
  const totalWdVol = withdrawals.reduce((s, e) => s + e.amountStroops, 0n);
  const pricePerShare =
    vault.state.totalSharesStroops === 0n
      ? 1.0
      : Number(vault.state.totalAssetsStroops) / Number(vault.state.totalSharesStroops);

  const kpiCards = [
    {
      label: "Total TVL",
      value: `${stroopsToXlm(vault.state.totalAssetsStroops)} XLM`,
      sub: "All depositors combined",
      icon: TrendingUp,
      accent: true,
    },
    {
      label: "Unique Wallets",
      value: String(uniqueUsers),
      sub: "Distinct addresses",
      icon: Users,
    },
    {
      label: "Total Deposits",
      value: `${stroopsToXlm(totalDepVol)} XLM`,
      sub: `${deposits.length} transactions`,
      icon: ArrowDownToLine,
      ok: true,
    },
    {
      label: "Total Withdrawals",
      value: `${stroopsToXlm(totalWdVol)} XLM`,
      sub: `${withdrawals.length} transactions`,
      icon: ArrowUpFromLine,
      warn: true,
    },
    {
      label: "Share Price",
      value: `${pricePerShare.toFixed(6)} XLM`,
      sub: "NAV per share",
      icon: DollarSign,
    },
    {
      label: "All Transactions",
      value: String(events.length),
      sub: "Deposits + withdrawals",
      icon: Activity,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="font-mono text-xs text-[var(--orbit-mute)] mt-1">
            Live analytics from Stellar Testnet · Auto-refreshes every 15s
          </p>
        </div>

        <StatsGrid cards={kpiCards} />

        <div className="grid gap-4 lg:grid-cols-2">
          <ActivityChart events={events} />
          <VaultHealthCard state={vault.state} />
        </div>

        <TransactionTable events={events.slice(0, 20)} />

        <UniqueUsersPanel events={events} />
      </div>
    </AdminLayout>
  );
}
