import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TransactionTable } from "@/components/admin/TransactionTable";
import { useVault } from "@/hooks/use-vault";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({
    meta: [
      { title: "Orbit Admin — Transactions" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTransactions,
});

function AdminTransactions() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const vault = useVault(null);

  useEffect(() => { setAuthed(isAdminAuthenticated()); }, []);
  if (!authed) return <AdminLoginPage onSuccess={() => setAuthed(true)} />;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">All Transactions</h1>
          <p className="font-mono text-xs text-[var(--orbit-mute)] mt-1">
            Full history · filter by type · export CSV
          </p>
        </div>
        <TransactionTable events={vault.events} />
      </div>
    </AdminLayout>
  );
}
