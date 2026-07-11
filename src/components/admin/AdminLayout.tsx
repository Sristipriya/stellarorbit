import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Globe,
  LayoutDashboard,
  History,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { adminLogout } from "@/lib/admin-auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/transactions", label: "Transactions", icon: History },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  function logout() {
    adminLogout();
    window.location.href = "/admin";
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden w-56 shrink-0 flex-col border-r border-[var(--orbit-edge)] bg-black/70 backdrop-blur-xl md:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-[var(--orbit-edge)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--orbit-accent)] shadow-[0_0_20px_var(--orbit-accent)]">
            <Globe className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">Orbit</div>
            <div className="font-mono text-[9px] text-[var(--orbit-mute)] uppercase tracking-widest">
              Admin Panel
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3 mt-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--orbit-accent)]/15 text-[var(--orbit-accent)] shadow-[inset_0_0_0_1px_var(--orbit-accent)/30]"
                    : "text-[var(--orbit-mute)] hover:bg-white/[0.04] hover:text-[var(--orbit-ink)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--orbit-edge)]">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-xs text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors"
          >
            ← Back to App
          </Link>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--orbit-mute)] transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] bg-black/40 px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[var(--orbit-accent)]" />
            <span className="font-display text-sm font-semibold">Orbit Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {NAV.map(({ href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${location.pathname === href ? "border-[var(--orbit-accent)]/40 text-[var(--orbit-accent)]" : "border-[var(--orbit-edge)] text-[var(--orbit-mute)]"}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
