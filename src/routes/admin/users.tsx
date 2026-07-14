import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UniqueUsersPanel } from "@/components/admin/UniqueUsersPanel";
import { useVault } from "@/hooks/use-vault";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [{ title: "Orbit Admin — Users" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const vault = useVault(null, "xlm");

  useEffect(() => {
    setAuthed(isAdminAuthenticated());
  }, []);
  if (!authed) return <AdminLoginPage onSuccess={() => setAuthed(true)} />;

  const uniqueCount = new Set(vault.events.map((e) => e.address)).size;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">User Activity</h1>
          <p className="font-mono text-xs text-[var(--orbit-mute)] mt-1">
            {uniqueCount} unique wallets have interacted with the vault
          </p>
        </div>
        <UniqueUsersPanel events={vault.events} />
      </div>
    </AdminLayout>
  );
}
