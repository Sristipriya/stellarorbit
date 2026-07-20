import { type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Globe,
  LayoutDashboard,
  History,
  Users,
  Settings,
  LogOut,
  Activity,
  ChevronRight,
  Shield,
} from "lucide-react";
import { adminLogout } from "@/lib/admin-auth";

const NAV = [
  { href: "/admin/", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/transactions", label: "Transactions", icon: History },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  function logout() {
    adminLogout();
    window.location.href = "/admin/";
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(0.08 0.012 260)" }}>
      {/* Sidebar */}
      <div
        className="hidden w-56 shrink-0 flex-col md:flex"
        style={{
          background: "oklch(0.10 0.014 260)",
          borderRight: "1px solid var(--orbit-edge)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--orbit-edge)]">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl shadow-[0_0_20px_var(--orbit-accent-soft)]"
            style={{ background: "var(--orbit-accent)" }}
          >
            <Shield className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="font-display text-sm font-bold">Orbit</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--orbit-ok)", boxShadow: "0 0 6px var(--orbit-ok)" }}
              />
              <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-ok)]">
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2 mt-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href || location.pathname === href.slice(0, -1);
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--orbit-accent)]/12 text-[var(--orbit-accent)]"
                    : "text-[var(--orbit-mute)] hover:bg-white/[0.04] hover:text-[var(--orbit-ink)]"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0 transition-all"
                  style={{
                    background: isActive ? "var(--orbit-accent)" : "var(--orbit-edge)",
                    boxShadow: isActive ? "0 0 6px var(--orbit-accent)" : "none",
                  }}
                />
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--orbit-edge)] space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 font-mono text-xs text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors"
          >
            <Globe className="h-4 w-4 shrink-0" />
            ← Back to App
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--orbit-mute)] transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between border-b border-[var(--orbit-edge)] px-6 py-4"
          style={{ background: "oklch(0.09 0.012 260 / 0.8)", backdropFilter: "blur(20px)" }}
        >
          <div>
            <h1 className="font-display text-base font-semibold">Admin Dashboard</h1>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mt-0.5">
              Orbit Protocol · Stellar Testnet · Real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <Activity className="h-3.5 w-3.5 text-[var(--orbit-ok)]" />
              <span className="text-[var(--orbit-ok)]">LIVE</span>
            </div>
            <div className="font-mono text-[9px] text-[var(--orbit-mute)] border border-[var(--orbit-edge)] rounded-lg px-2.5 py-1.5">
              Auto-refresh 15s
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--orbit-edge)] md:hidden">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                location.pathname === href
                  ? "border-[var(--orbit-accent)]/40 text-[var(--orbit-accent)]"
                  : "border-[var(--orbit-edge)] text-[var(--orbit-mute)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
