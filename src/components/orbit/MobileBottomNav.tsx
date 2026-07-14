import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Trophy,
  Calculator,
  Star,
} from "lucide-react";

export type Tab =
  | "portfolio"
  | "deposit"
  | "withdraw"
  | "history"
  | "leaderboard"
  | "simulate"
  | "faucet"
  | "settings"
  | "points";

const MOBILE_TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "portfolio", label: "Home", icon: LayoutDashboard },
  { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { id: "points", label: "Points", icon: Star },
  { id: "history", label: "History", icon: History },
];

export function MobileBottomNav({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <nav className="mobile-bottom-nav md:hidden">
      {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`mobile-bottom-nav-item ${active === id ? "active" : ""}`}
          onClick={() => onSelect(id)}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </nav>
  );
}
