import { createFileRoute } from "@tanstack/react-router";
import { AppDashboard } from "@/components/orbit/AppDashboard";

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
  return <AppDashboard />;
}
