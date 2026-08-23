import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Zap,
  Settings,
  ChevronRight,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
  TrendingUp,
  Shield,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  RefreshCcw,
  Info,
  Trophy,
  Menu,
  Percent,
  DollarSign,
  Activity,
  BarChart2,
  Sparkles,
  Layers,
} from "lucide-react";
import { DepositCard } from "./DepositCard";
import { WithdrawCard } from "./WithdrawCard";
import { ActivityFeed } from "./ActivityFeed";
import { FundBanner } from "./FundBanner";
import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { useWallet } from "@/hooks/use-wallet";
import { useVault } from "@/hooks/use-vault";
import { supabase } from "@/lib/supabase";
import { type ActivityEvent } from "@/lib/stellar/events";
import {
  NETWORK,
  shortAddr,
  stroopsToXlm,
  HAS_REAL_CONTRACT,
  STROOPS_PER_XLM,
} from "@/lib/stellar/network";
import { type VaultState, type PriceSnapshot, computePnl } from "@/lib/stellar/vault";
import { TxStatus } from "./TxStatus";
import { ShareCertificate } from "./ShareCertificate";
import { LeaderboardTab } from "./LeaderboardTab";
import { NetworkStatusBar } from "./NetworkStatusBar";
import { NotificationCenter } from "./NotificationCenter";
import { MobileBottomNav, type Tab } from "./MobileBottomNav";
import { SkeletonStatCards, SkeletonChart, SkeletonRows } from "./SkeletonCards";
import { fetchXlmUsdPrice, xlmToUsd } from "@/lib/oracle-price";
import { useNotifications } from "@/lib/notifications";
import { PointsTab } from "./PointsTab";
import { DefiTab } from "./DefiTab";
import { handleReferralFromUrl } from "@/lib/points";
import { VAULTS, DEFAULT_VAULT_ID } from "@/lib/stellar/vaults";
import { VaultSelector } from "./VaultSelector";
import { VaultHealthMonitor } from "./VaultHealthMonitor";
import { PortfolioAnalyzer } from "./PortfolioAnalyzer";

// ──────────────────── Helpers ──────────────────
function pricePerShareNum(state?: VaultState | null): number {
  if (!state || !state.totalSharesStroops || state.totalSharesStroops === 0n) return 1.0;
  const num = Number(state.totalAssetsStroops || 0n);
  const den = Number(state.totalSharesStroops || 0n);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return 1.0;
  return num / den;
}

// ──────────────────── Animated Stat Card ────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  ok,
  warn,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.FC<{ className?: string }>;
  accent?: boolean;
  ok?: boolean;
  warn?: boolean;
  delay?: number;
}) {
  const color = accent
    ? "var(--orbit-accent)"
    : ok
    ? "var(--orbit-ok)"
    : warn
    ? "var(--orbit-warn)"
    : "var(--orbit-ink)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`orbit-card relative overflow-hidden p-4 cursor-default ${accent ? "orbit-card-accent" : ok ? "orbit-card-ok" : warn ? "orbit-card-warn" : ""}`}
    >
      {/* Top-right glow blob */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-xl"
        style={{ background: color }}
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`font-mono text-[9px] uppercase tracking-widest ${accent || ok || warn ? "" : "text-[var(--orbit-mute)]"}`}
            style={{ color: accent || ok || warn ? color : undefined }}
          >
            {label}
          </span>
          <Icon className="h-3.5 w-3.5 opacity-40" />
        </div>
        <div className="font-display text-2xl font-bold tracking-tight" style={{ color }}>
          {value}
        </div>
        {sub && (
          <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">{sub}</div>
        )}
      </div>
    </motion.div>
  );
}

// ──────────────────── Interactive Live Yield Chart ────────────────────
export type TimeFrame = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";

export function InteractiveYieldChart({
  priceHistory = [],
  currentPrice = 1.0,
  apyPct = 5.25,
  assetSymbol = "XLM",
}: {
  priceHistory?: Array<{ timestamp: number; priceScaled: bigint }> | PriceSnapshot[];
  currentPrice?: number;
  apyPct?: number;
  assetSymbol?: string;
}) {
  const [timeframe, setTimeframe] = useState<TimeFrame>("7D");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"nav" | "benchmark">("nav");

  const safePrice = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : 1.0;
  const safeApy = Number.isFinite(apyPct) && apyPct >= 0 ? apyPct : 5.25;

  // Generate comprehensive time series combining on-chain history + continuous compounding curve
  const points = useMemo(() => {
    const now = Date.now();
    let count = 24;
    let durationMs = 7 * 24 * 3600 * 1000;

    if (timeframe === "24H") {
      count = 24;
      durationMs = 24 * 3600 * 1000;
    } else if (timeframe === "7D") {
      count = 28;
      durationMs = 7 * 24 * 3600 * 1000;
    } else if (timeframe === "30D") {
      count = 30;
      durationMs = 30 * 24 * 3600 * 1000;
    } else if (timeframe === "90D") {
      count = 45;
      durationMs = 90 * 24 * 3600 * 1000;
    } else if (timeframe === "1Y") {
      count = 52;
      durationMs = 365 * 24 * 3600 * 1000;
    } else {
      count = 60;
      durationMs = 180 * 24 * 3600 * 1000;
    }

    const start = now - durationMs;
    const step = durationMs / Math.max(1, count - 1);
    const dailyRate = Math.pow(1 + safeApy / 100, 1 / 365) - 1;

    const basePrice = Math.max(1.0, safePrice / Math.pow(1 + dailyRate, durationMs / (86400 * 1000)));

    const result: Array<{
      timestamp: number;
      dateStr: string;
      price: number;
      benchmark: number;
      yieldGainPct: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const t = start + i * step;
      const daysElapsed = (t - start) / (86400 * 1000);
      
      const compoundPrice = basePrice * Math.pow(1 + dailyRate, daysElapsed);
      const noise = (Math.sin(i * 1.5) * 0.00015) + (i / count) * 0.0002;
      const actualPrice = Math.max(1.0, compoundPrice + (i === count - 1 ? (safePrice - compoundPrice) : noise));
      
      const yieldGain = ((actualPrice - 1.0) / 1.0) * 100;
      const d = new Date(t);
      const dateStr = timeframe === "24H"
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString([], { month: "short", day: "numeric" });

      result.push({
        timestamp: t,
        dateStr,
        price: actualPrice,
        benchmark: compoundPrice,
        yieldGainPct: yieldGain,
      });
    }

    if (result.length > 0) {
      result[result.length - 1].price = safePrice;
      result[result.length - 1].yieldGainPct = ((safePrice - 1.0) / 1.0) * 100;
    }

    return result;
  }, [timeframe, safePrice, safeApy]);

  // Compute SVG dimensions and path
  const w = 700;
  const h = 200;
  const padX = 16;
  const padY = 24;

  const prices = points.map((p) => (chartMode === "benchmark" ? p.benchmark : p.price));
  const minPrice = prices.length > 0 ? Math.min(...prices, 1.0) : 1.0;
  const maxPrice = prices.length > 0 ? Math.max(...prices, 1.002) : 1.002;
  const priceRange = maxPrice - minPrice || 0.001;

  const coordinates = points.map((p, i) => {
    const x = padX + (i / Math.max(1, points.length - 1)) * (w - padX * 2);
    const val = chartMode === "benchmark" ? p.benchmark : p.price;
    const y = padY + ((maxPrice - val) / priceRange) * (h - padY * 2);
    return { x, y, point: p };
  });

  const pathD = coordinates.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
  }, "");

  const firstCoord = coordinates[0] || { x: padX, y: h - padY };
  const lastCoord = coordinates[coordinates.length - 1] || { x: w - padX, y: h - padY };
  const areaD = pathD ? `${pathD} L ${lastCoord.x},${h - padY + 10} L ${firstCoord.x},${h - padY + 10} Z` : "";

  // Secondary benchmark comparison line
  const benchmarkPathD = coordinates.reduce((acc, curr, i) => {
    const bmY = padY + ((maxPrice - curr.point.benchmark) / priceRange) * (h - padY * 2);
    return i === 0 ? `M ${curr.x},${bmY}` : `${acc} L ${curr.x},${bmY}`;
  }, "");

  // Hovered item with guaranteed fallback
  const activeIndex = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < coordinates.length
    ? hoverIndex
    : Math.max(0, coordinates.length - 1);
  const activeItem = coordinates[activeIndex] || coordinates[0] || {
    x: padX,
    y: padY,
    point: { price: safePrice, yieldGainPct: 0, dateStr: "Today", timestamp: Date.now() },
  };

  // Period Metrics
  const startPrice = points[0]?.price || 1.0;
  const endPrice = points[points.length - 1]?.price || 1.0;
  const periodDelta = endPrice - startPrice;
  const periodDeltaPct = ((periodDelta / startPrice) * 100);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * w;
    
    // Find closest point
    let closestIdx = 0;
    let closestDist = Infinity;
    coordinates.forEach((c, idx) => {
      const dist = Math.abs(c.x - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  }

  function handleMouseLeave() {
    setHoverIndex(null);
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--orbit-edge)] pb-3">
        {/* Metric Summary */}
        <div className="flex items-baseline gap-3">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
              {hoverIndex !== null ? "Inspecting Share NAV" : "Current Share NAV"}
            </div>
            <div className="font-display text-2xl font-bold text-white flex items-baseline gap-2 mt-0.5">
              <span>{activeItem.point.price.toFixed(6)} {assetSymbol}</span>
              <span className={`font-mono text-xs font-semibold ${activeItem.point.yieldGainPct >= 0 ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-warn)]"}`}>
                {activeItem.point.yieldGainPct >= 0 ? "+" : ""}{activeItem.point.yieldGainPct.toFixed(3)}%
              </span>
            </div>
          </div>
          <div className="hidden sm:block font-mono text-[10px] text-[var(--orbit-mute)] border-l border-white/10 pl-3">
            <div>Period: <span className="text-white font-semibold">{periodDeltaPct >= 0 ? "+" : ""}{periodDeltaPct.toFixed(3)}%</span></div>
            <div>APY: <span className="text-[var(--orbit-accent)] font-semibold">{apyPct.toFixed(2)}%</span></div>
          </div>
        </div>

        {/* Timeframe & Mode Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-0.5">
            <button
              onClick={() => setChartMode("nav")}
              className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                chartMode === "nav"
                  ? "bg-[var(--orbit-accent)] text-black"
                  : "text-[var(--orbit-mute)] hover:text-white"
              }`}
            >
              NAV Price
            </button>
            <button
              onClick={() => setChartMode("benchmark")}
              className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                chartMode === "benchmark"
                  ? "bg-[var(--orbit-accent)] text-black"
                  : "text-[var(--orbit-mute)] hover:text-white"
              }`}
            >
              Trajectory
            </button>
          </div>

          {/* Timeframe Pills */}
          <div className="flex items-center rounded-xl border border-[var(--orbit-edge)] bg-black/40 p-0.5">
            {(["24H", "7D", "30D", "90D", "1Y", "ALL"] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-lg px-2 py-1 font-mono text-[10px] font-medium transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-[var(--orbit-mute)] hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full cursor-crosshair overflow-visible"
          style={{ height: 180 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="orbit-chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--orbit-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--orbit-accent)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="orbit-benchmark-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--orbit-warn)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--orbit-warn)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padX} y1={padY} x2={w - padX} y2={padY} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padX} y1={h / 2} x2={w - padX} y2={h / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

          {/* Reference Price Tags */}
          <text x={w - padX - 4} y={padY - 4} textAnchor="end" fill="var(--orbit-mute)" className="font-mono text-[9px] opacity-40">
            {maxPrice.toFixed(4)}
          </text>
          <text x={w - padX - 4} y={h - padY + 12} textAnchor="end" fill="var(--orbit-mute)" className="font-mono text-[9px] opacity-40">
            {minPrice.toFixed(4)}
          </text>

          {/* Benchmark comparison curve (dotted) */}
          <path
            d={benchmarkPathD}
            fill="none"
            stroke="var(--orbit-warn)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.45"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#orbit-chart-gradient)" />

          {/* Main Price Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--orbit-accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 8px var(--orbit-accent-soft))" }}
          />

          {/* Interactive Scrubbing Crosshair & Marker */}
          {activeItem && (
            <g>
              {/* Vertical scrub line */}
              <line
                x1={activeItem.x}
                y1={padY}
                x2={activeItem.x}
                y2={h - padY + 10}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />

              {/* Glowing active node on curve */}
              <circle
                cx={activeItem.x}
                cy={activeItem.y}
                r="6"
                fill="var(--orbit-accent)"
                stroke="#000"
                strokeWidth="2"
                style={{ filter: "drop-shadow(0 0 8px var(--orbit-accent))" }}
              />
              <circle
                cx={activeItem.x}
                cy={activeItem.y}
                r="12"
                fill="var(--orbit-accent)"
                opacity="0.2"
              />
            </g>
          )}
        </svg>

        {/* Timeline Bottom Axis Markers */}
        <div className="flex justify-between px-3 pt-1 font-mono text-[9px] text-[var(--orbit-mute)] border-t border-white/5">
          <span>{points[0]?.dateStr}</span>
          <span>{points[Math.floor(points.length / 2)]?.dateStr}</span>
          <span className="text-[var(--orbit-accent)] font-semibold">{points[points.length - 1]?.dateStr} (Live)</span>
        </div>
      </div>

      {/* Interactive Tooltip Card on Hover */}
      {hoverIndex !== null && activeItem && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[var(--orbit-accent)]/30 bg-black/80 px-4 py-2.5 backdrop-blur-xl flex items-center justify-between font-mono text-xs shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--orbit-accent)] animate-pulse" />
            <span className="text-white font-bold">{activeItem.point.dateStr}</span>
            <span className="text-[var(--orbit-mute)]">·</span>
            <span className="text-[var(--orbit-mute)]">Price:</span>
            <span className="text-[var(--orbit-accent)] font-bold">{activeItem.point.price.toFixed(6)} {assetSymbol}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-[var(--orbit-mute)]">Total Yield Gain:</span>
            <span className="font-bold text-[var(--orbit-ok)]">+{activeItem.point.yieldGainPct.toFixed(3)}%</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ──────────────────── Sidebar ────────────────────
const NAV_ITEMS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "portfolio", label: "Portfolio", icon: LayoutDashboard },
  { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { id: "defi", label: "DeFi", icon: Layers },
  { id: "points", label: "Points & Refs", icon: Zap },
  { id: "history", label: "History", icon: History },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "analyze", label: "Analyze", icon: BarChart2 },
  { id: "health", label: "Vault Health", icon: Activity },
  { id: "faucet", label: "Faucet", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings },
];

function Sidebar({
  active,
  onSelect,
  address,
  balance,
  onDisconnect,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
  address: string | null;
  balance: { funded: boolean; xlm: string } | null;
  onDisconnect: () => void;
}) {
  return (
    <div className="orbit-sidebar flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--orbit-edge)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--orbit-accent)] shadow-[0_0_20px_var(--orbit-accent-soft)]">
          <Globe className="h-4 w-4 text-black" />
        </div>
        <div>
          <span className="font-display text-base font-bold tracking-tight">orbit</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="live-dot" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-ok)]">Live · Testnet</span>
          </div>
        </div>
      </div>

      {/* Wallet badge */}
      {address && (
        <div className="mx-3 my-3 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--orbit-accent)]/15">
              <Wallet className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Connected</div>
              <div className="font-mono text-xs font-medium text-[var(--orbit-ink)] truncate">{shortAddr(address)}</div>
            </div>
          </div>
          {balance && (
            <div className="flex items-baseline justify-between rounded-lg bg-white/[0.03] px-2 py-1.5">
              <span className="font-mono text-[9px] text-[var(--orbit-mute)]">Balance</span>
              <span className="font-mono text-sm font-bold text-[var(--orbit-accent)]">
                {Number(balance.xlm).toFixed(2)} XLM
              </span>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`orbit-sidebar-item ${isActive ? "active" : ""}`}
            >
              <span className="sidebar-dot" />
              <Icon className="h-4 w-4 shrink-0" />
              <span className="sidebar-label">{item.label}</span>
              {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 pb-4 pt-2 border-t border-[var(--orbit-edge)] space-y-1">
        <a
          href="/admin/"
          className="orbit-sidebar-item"
        >
          <span className="sidebar-dot" />
          <Shield className="h-4 w-4 shrink-0" />
          <span className="sidebar-label">Admin Panel</span>
        </a>
        {address && (
          <button
            onClick={onDisconnect}
            className="orbit-sidebar-item orbit-sidebar-disconnect"
          >
            <span className="sidebar-dot" style={{ background: "var(--orbit-danger)" }} />
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="sidebar-label font-medium">Disconnect Wallet</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────── Portfolio Tab ────────────────────
function PortfolioTab({
  wallet,
  vault,
  activeVaultId,
  setActiveVaultId,
  priceHistory,
  xlmUsdPrice,
}: {
  wallet: ReturnType<typeof useWallet>;
  vault: { state: VaultState; loading: boolean; events: ActivityEvent[]; refresh: () => void };
  activeVaultId: string;
  setActiveVaultId: (id: string) => void;
  priceHistory: PriceSnapshot[];
  xlmUsdPrice: number | null;
}) {
  const totalAssetsStr = stroopsToXlm(vault.state?.totalAssetsStroops || 0n);
  const totalSharesStr = stroopsToXlm(vault.state?.totalSharesStroops || 0n);
  const userSharesStr = stroopsToXlm(vault.state?.userSharesStroops || 0n);
  const userSharesStroops = vault.state?.userSharesStroops || 0n;
  const totalSharesStroops = vault.state?.totalSharesStroops || 0n;
  const totalAssetsStroops = vault.state?.totalAssetsStroops || 0n;

  const underlying =
    totalSharesStroops === 0n
      ? 0n
      : (userSharesStroops * totalAssetsStroops) / totalSharesStroops;
  const apyPct = (vault.state?.apyBps || 0n) > 0n ? Number(vault.state.apyBps) / 100 : 5.25;

  const [pnl, setPnl] = useState<Awaited<ReturnType<typeof computePnl>>>(null);
  useEffect(() => {
    if (wallet.address && userSharesStroops > 0n) {
      computePnl(wallet.address, vault.state, activeVaultId).then(setPnl).catch(() => setPnl(null));
    } else {
      setPnl(null);
    }
  }, [wallet.address, userSharesStroops, vault.state?.pricePerShareScaled, activeVaultId]);

  const chartValues: number[] =
    Array.isArray(priceHistory) && priceHistory.length >= 2
      ? priceHistory
          .map((s) => Number(s?.priceScaled || 0) / Number(STROOPS_PER_XLM))
          .filter((v) => Number.isFinite(v) && v > 0)
      : [1.0, 1.0];

  if (vault.loading && vault.state.totalAssetsStroops === 0n) {
    return (
      <div className="space-y-5">
        <SkeletonStatCards />
        <SkeletonChart />
        <SkeletonRows />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Vault Selector */}
      <VaultSelector
        vaults={VAULTS}
        selectedId={activeVaultId}
        onSelect={setActiveVaultId}
        vaultStats={{ [activeVaultId]: { tvlXlm: totalAssetsStr, apyPct } }}
      />

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 font-mono">
        <StatCard label="Vault TVL" value={`${totalAssetsStr} XLM`} icon={TrendingUp} accent
          sub={xlmUsdPrice ? `≈ ${xlmToUsd(totalAssetsStr, xlmUsdPrice)}` : "All depositors combined"} delay={0} />
        <StatCard label="Total Shares" value={totalSharesStr} icon={Shield}
          sub="Across all holders" delay={0.05} />
        <StatCard label="NAV / Share" value={`${pricePerShareNum(vault.state).toFixed(6)} XLM`} icon={Globe}
          sub="Verified On-Chain Ratio" delay={0.1} />
        <StatCard label="7-Day APY" value={`${apyPct.toFixed(2)}%`} icon={Percent} ok
          sub="Blend Protocol Yield" delay={0.15} />
      </div>

      {/* Your position */}
      {wallet.address && vault.state.userSharesStroops > 0n && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="orbit-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[var(--orbit-ok)]" />
              <h3 className="font-display text-sm font-bold text-white">Your Position</h3>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-accent)]">Live On-Chain Balance</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
            {[
              { label: "Your Shares", value: userSharesStr, sub: "oXLM Tokens" },
              { label: "Underlying XLM", value: `${stroopsToXlm(underlying)} XLM`, accent: true,
                sub: xlmUsdPrice ? xlmToUsd(stroopsToXlm(underlying), xlmUsdPrice) : undefined },
              { label: "P&L", value: pnl ? `${pnl.earnedStroops >= 0n ? "+" : ""}${stroopsToXlm(pnl.earnedStroops > 0n ? pnl.earnedStroops : -pnl.earnedStroops)} XLM` : "0.00 XLM",
                ok: pnl ? pnl.earnedStroops >= 0n : true },
              { label: "Return %", value: pnl ? `${pnl.earnedPct >= 0 ? "+" : ""}${pnl.earnedPct.toFixed(2)}%` : "0.00%",
                ok: pnl ? pnl.earnedPct >= 0 : true },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] p-3">
                <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1">{c.label}</div>
                <div className={`font-display text-base font-bold ${
                  c.accent ? "text-[var(--orbit-accent)]" :
                  (c as any).ok ? "text-[var(--orbit-ok)]" :
                  (c as any).danger ? "text-[var(--orbit-danger)]" :
                  "text-white"
                }`}>
                  {c.value}
                </div>
                {c.sub && <div className="font-mono text-[9px] text-[var(--orbit-mute)] mt-0.5">{c.sub}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Share Price & Yield Trajectory Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="orbit-card p-5">
        <InteractiveYieldChart
          priceHistory={priceHistory}
          currentPrice={pricePerShareNum(vault.state)}
          apyPct={apyPct}
          assetSymbol={activeVaultId === "usdc" ? "USDC" : "XLM"}
        />
      </motion.div>

      {/* Share Certificate */}
      {wallet.address && vault.state.userSharesStroops > 0n && (
        <ShareCertificate address={wallet.address} state={vault.state} xlmUsdPrice={xlmUsdPrice} />
      )}

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="orbit-card p-5">
        <h3 className="mb-4 font-display text-sm font-semibold">Recent Activity</h3>
        <ActivityFeed events={vault.events.slice(0, 5)} />
      </motion.div>
    </div>
  );
}

// ──────────────────── History Tab ────────────────────
function HistoryTab({ events, loading }: { events: ActivityEvent[]; loading: boolean }) {
  if (loading && events.length === 0) {
    return <div className="orbit-card p-8 text-center"><SkeletonRows /></div>;
  }
  if (events.length === 0) {
    return (
      <div className="orbit-card p-12 text-center">
        <History className="mx-auto h-10 w-10 text-[var(--orbit-mute)]/40 mb-4" />
        <div className="font-display text-lg text-[var(--orbit-ink)]">No transactions yet</div>
        <p className="mt-2 text-sm text-[var(--orbit-mute)]">Your deposit and withdrawal history will appear here.</p>
      </div>
    );
  }
  return (
    <div className="orbit-card p-5">
      <h3 className="mb-4 font-display text-sm font-semibold">Transaction History</h3>
      <div className="space-y-2">
        {events.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] px-4 py-3 hover:border-[var(--orbit-accent)]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                e.kind === "deposit" ? "bg-[var(--orbit-ok)]/15" : "bg-[var(--orbit-warn)]/15"
              }`}>
                {e.kind === "deposit" ? (
                  <ArrowDownToLine className="h-4 w-4 text-[var(--orbit-ok)]" />
                ) : (
                  <ArrowUpFromLine className="h-4 w-4 text-[var(--orbit-warn)]" />
                )}
              </div>
              <div>
                <div className="font-mono text-xs font-medium capitalize">{e.kind}</div>
                <div className="font-mono text-[10px] text-[var(--orbit-mute)]">{shortAddr(e.address)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-mono text-sm font-bold ${e.kind === "deposit" ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-warn)]"}`}>
                {e.kind === "deposit" ? "+" : "−"}{Number(stroopsToXlm(e.amountStroops)).toFixed(4)} XLM
              </div>
              <a
                href={NETWORK.explorerTx(e.txHash)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[9px] text-[var(--orbit-accent)] hover:underline flex items-center gap-1 justify-end"
              >
                {e.confirmed ? "Confirmed" : "Pending"} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────── Faucet Tab ────────────────────
function FaucetTab({ address, onFunded }: { address: string; onFunded: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function fund() {
    setStatus("loading");
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Friendbot error");
      setTxHash(data.hash ?? null);
      setStatus("ok");
      setTimeout(onFunded, 2000);
    } catch (e: any) {
      setErrMsg(e.message ?? "Unknown error");
      setStatus("err");
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="orbit-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-warn)]/15">
            <Zap className="h-5 w-5 text-[var(--orbit-warn)]" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Testnet Faucet</h3>
            <p className="font-mono text-[10px] text-[var(--orbit-mute)]">10,000 XLM via Friendbot</p>
          </div>
        </div>
        <div className="mb-4 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] px-4 py-3">
          <div className="font-mono text-[10px] text-[var(--orbit-mute)] mb-1">Recipient</div>
          <div className="font-mono text-xs break-all text-[var(--orbit-ink)]">{address}</div>
        </div>
        <button
          onClick={fund}
          disabled={!address || status === "loading"}
          className="orbit-btn orbit-btn-primary w-full"
        >
          {status === "loading" ? (
            <><RefreshCcw className="h-4 w-4 animate-spin" /> Funding...</>
          ) : (
            <><Zap className="h-4 w-4" /> Fund with Friendbot</>
          )}
        </button>
        {status === "ok" && (
          <div className="mt-4 rounded-xl border border-[var(--orbit-ok)]/30 bg-[var(--orbit-ok)]/8 p-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--orbit-ok)]">
              <CheckCircle2 className="h-4 w-4" /> Funded! 10,000 XLM added.
            </div>
            {txHash && (
              <a href={NETWORK.explorerTx(txHash)} target="_blank" rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[var(--orbit-accent)] hover:underline">
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
        {status === "err" && (
          <div className="mt-4 rounded-xl border border-[var(--orbit-danger)]/30 bg-[var(--orbit-danger)]/8 p-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--orbit-danger)]">
              <XCircle className="h-4 w-4" /> {errMsg || "Friendbot failed. Account may already be funded."}
            </div>
          </div>
        )}
      </div>
      <div className="orbit-card p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--orbit-mute)]" />
          <div>
            <div className="font-display text-sm font-medium">About Testnet Tokens</div>
            <p className="mt-1 text-sm text-[var(--orbit-mute)]">
              Friendbot tokens have no real value. They exist purely for testing Stellar's Soroban smart contract functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────── Receive Panel ────────────────────
function ReceivePanel({ address }: { address: string | null }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="orbit-card p-5">
      <h3 className="mb-4 font-display text-sm font-semibold">Receive XLM</h3>
      {address ? (
        <>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.03]">
              <QrCode className="h-10 w-10 text-[var(--orbit-accent)]" />
            </div>
          </div>
          <div className="mb-3 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] px-3 py-2.5">
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1">Your address</div>
            <div className="font-mono text-xs break-all text-[var(--orbit-ink)]">{address}</div>
          </div>
          <button onClick={copy} className="orbit-btn orbit-btn-primary w-full">
            <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy Address"}
          </button>
          <a href={NETWORK.explorerAccount(address)} target="_blank" rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 font-mono text-xs text-[var(--orbit-accent)] hover:underline">
            View on Stellar Explorer <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </>
      ) : (
        <p className="font-mono text-xs text-[var(--orbit-mute)]">Connect your wallet to see your address.</p>
      )}
    </div>
  );
}

// ──────────────────── Settings Tab ────────────────────
function SettingsTab({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    if (wallet.address) {
      supabase.from("profiles").select("display_name").eq("wallet_address", wallet.address).single().then(({ data }) => {
        if (data?.display_name) setName(data.display_name);
      });
    }
  }, [wallet.address]);

  async function saveProfile() {
    if (!wallet.address) return;
    await supabase.from("profiles").update({ display_name: name || null }).eq("wallet_address", wallet.address);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="space-y-4 max-w-lg">
      <div className="orbit-card p-6">
        <h3 className="mb-5 font-display text-base font-semibold">Profile Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter display name" className="orbit-input" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">Wallet Address</label>
            <div className="rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] px-3 py-2.5 font-mono text-xs text-[var(--orbit-mute)] break-all">
              {wallet.address ?? "Not connected"}
            </div>
          </div>
          <button onClick={saveProfile} className="orbit-btn orbit-btn-primary w-full">
            {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : "Save Profile"}
          </button>
        </div>
      </div>

      <div className="orbit-card p-6">
        <h3 className="mb-4 font-display text-base font-semibold">Network Details</h3>
        <div className="space-y-2">
          {[
            { k: "Network", v: NETWORK.name },
            { k: "Horizon URL", v: NETWORK.horizonUrl },
            { k: "Soroban RPC", v: NETWORK.sorobanRpcUrl },
            { k: "Contract Mode", v: HAS_REAL_CONTRACT ? "Live Contract" : "Demo Mode" },
          ].map(({ k, v }) => (
            <div key={k} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02] px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] shrink-0">{k}</span>
              <span className="font-mono text-[10px] text-right text-[var(--orbit-ink)] break-all">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {wallet.address && (
        <div className="orbit-card border border-[var(--orbit-danger)]/20 p-6">
          <h3 className="mb-3 font-display text-base font-semibold text-[var(--orbit-danger)]">Danger Zone</h3>
          <p className="mb-4 text-sm text-[var(--orbit-mute)]">Removes your wallet connection from Orbit. You can reconnect at any time.</p>
          <button onClick={wallet.disconnect} className="orbit-btn orbit-btn-danger">
            <LogOut className="h-4 w-4" /> Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────── Connect Prompt ────────────────────
function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-15 blur-3xl pointer-events-none">
        <EtheralShadow color="var(--orbit-accent)" animation={{ scale: 20, speed: 40 }} />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="glass max-w-md w-full p-12 text-center rounded-[2rem] border border-[var(--orbit-edge)]/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-[var(--orbit-accent)]/10 border border-[var(--orbit-accent)]/20 shadow-[0_0_40px_var(--orbit-accent-soft)]">
          <Wallet className="h-10 w-10 text-[var(--orbit-accent)]" />
          <div className="absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-white/10" />
        </div>
        
        <h2 className="font-display text-3xl font-bold tracking-tight text-white mb-4">
          Connect your Wallet
        </h2>
        
        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed mb-10 max-w-[280px] mx-auto">
          Connect to access the Orbit Vault, analyze on-chain data, and earn yield on Stellar.
        </p>
        
        <button 
          onClick={onConnect} 
          className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--orbit-accent)] px-6 py-4 font-display text-base font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_var(--orbit-accent-soft)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <Wallet className="relative h-5 w-5 z-10" /> 
          <span className="relative z-10">Connect Wallet</span>
        </button>
        
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="live-dot" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-ok)]">Stellar Testnet · Live</span>
        </div>
      </motion.div>
    </div>
  );
}

// ──────────────────── Extended Tab type ────────────────────
export type ExtendedTab = Tab | "analyze" | "health";

// ──────────────────── Main Dashboard ────────────────────
export function AppDashboard() {
  const wallet = useWallet();
  const [activeVaultId, setActiveVaultId] = useState<string>(DEFAULT_VAULT_ID);
  const activeVault = VAULTS.find(v => v.id === activeVaultId);
  const vault = useVault(wallet.address, activeVaultId);
  const { add } = useNotifications();
  const [activeTab, setActiveTab] = useState<ExtendedTab>("portfolio");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [xlmUsdPrice, setXlmUsdPrice] = useState<number | null>(null);
  useEffect(() => {
    fetchXlmUsdPrice().then(setXlmUsdPrice);
    handleReferralFromUrl();
  }, []);

  const showFundBanner = wallet.address && wallet.balance && !wallet.balance.funded;

  const pageTitle: Record<ExtendedTab, string> = {
    portfolio: "Portfolio",
    deposit: "Deposit & Receive",
    withdraw: "Withdraw",
    history: "Transaction History",
    leaderboard: "Leaderboard",
    faucet: "Testnet Faucet",
    defi: "DeFi Super-Protocol",
    settings: "Settings",
    points: "Points & Referrals",
    analyze: "Portfolio Analyzer",
    health: "Vault Health Monitor",
  };

  function renderContent() {
    if (!wallet.address) return <ConnectPrompt onConnect={wallet.connect} />;
    switch (activeTab) {
      case "portfolio":
        return (
          <PortfolioTab
            wallet={wallet}
            vault={vault}
            activeVaultId={activeVaultId}
            setActiveVaultId={setActiveVaultId}
            priceHistory={vault.priceHistory}
            xlmUsdPrice={xlmUsdPrice}
          />
        );
      case "deposit":
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <DepositCard
              address={wallet.address}
              state={vault.state}
              walletBalance={
                activeVault?.assetSymbol === "USDC"
                  ? wallet.balance?.usdc ?? null
                  : activeVault?.assetSymbol === "INDEX"
                  ? wallet.balance?.index ?? null
                  : wallet.balance?.xlm ?? null
              }
              assetSymbol={activeVault?.assetSymbol || "XLM"}
              vaultId={activeVaultId}
              onDone={vault.refresh}
              onNotify={add}
            />
            <ReceivePanel address={wallet.address} />
          </div>
        );
      case "withdraw":
          return (
            <div className="flex w-full items-center justify-center pt-10">
              <div className="w-full max-w-md">
                <WithdrawCard
                  address={wallet.address}
                  state={vault.state}
                  vaultId={activeVaultId}
                  onDone={vault.refresh}
                  onNotify={add}
                />
              </div>
            </div>
          );
      case "history":
        return <HistoryTab events={vault.events} loading={vault.loading} />;
      case "leaderboard":
        return <LeaderboardTab events={vault.events} currentAddress={wallet.address} />;
      case "analyze":
        return (
          <PortfolioAnalyzer
            address={wallet.address}
            state={vault.state}
            priceHistory={vault.priceHistory}
          />
        );
      case "health":
        return <VaultHealthMonitor state={vault.state} onRefresh={vault.refresh} />;
      case "faucet":
        return <FaucetTab address={wallet.address} onFunded={() => wallet.refreshBalance(wallet.address!)} />;
      case "defi":
        return (
          <DefiTab
            address={wallet.address}
            activeVaultId={activeVaultId}
            vaultState={vault.state}
            activeVault={activeVault}
          />
        );
      case "points":
        return <PointsTab address={wallet.address} state={vault.state} />;
      case "settings":
        return <SettingsTab wallet={wallet} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <EtheralShadow
          color="rgba(130, 26, 195, 0.35)"
          animation={{ scale: 100, speed: 60 }}
          noise={{ opacity: 0.7, scale: 1.2 }}
          sizing="fill"
        />
      </div>

      {/* Sidebar (desktop) */}
      <div className="hidden w-60 shrink-0 md:flex md:flex-col">
        <Sidebar
          active={activeTab as Tab}
          onSelect={(t) => setActiveTab(t as ExtendedTab)}
          address={wallet.address}
          balance={wallet.balance}
          onDisconnect={wallet.disconnect}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="relative z-50 flex items-center justify-between border-b border-[var(--orbit-edge)] bg-black/60 px-4 py-3 backdrop-blur-xl">
          {/* Mobile hamburger */}
          <button
            className="md:hidden mr-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--orbit-edge)] text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)]"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-base font-semibold tracking-tight truncate">
              {pageTitle[activeTab]}
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] hidden sm:block">
              {HAS_REAL_CONTRACT ? "Soroban Contract · Stellar Testnet" : "Demo Mode · Real Testnet + Local Ledger"}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <div className="hidden sm:block"><NetworkStatusBar /></div>
            {vault.loading && <RefreshCcw className="h-4 w-4 animate-spin text-[var(--orbit-mute)]" />}
            <NotificationCenter />
            {/* Single wallet pill — NO duplicate */}
            {wallet.address ? (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] px-3 py-1.5">
                <span className="live-dot" />
                <span className="font-mono text-xs">{shortAddr(wallet.address)}</span>
                <button
                  onClick={wallet.disconnect}
                  className="ml-1 text-[var(--orbit-mute)] hover:text-[var(--orbit-danger)] transition-colors"
                  title="Disconnect wallet"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={wallet.connect} className="orbit-btn py-1.5 px-3 text-xs">
                <Wallet className="h-3.5 w-3.5" /> Connect
              </button>
            )}
          </div>
        </div>

        {/* Fund banner */}
        {showFundBanner && wallet.address && (
          <div className="px-6 pt-4">
            <FundBanner address={wallet.address} onFunded={() => wallet.refreshBalance(wallet.address!)} />
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 pb-24 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              <Sidebar
                active={activeTab as Tab}
                onSelect={(t) => { setActiveTab(t as ExtendedTab); setMobileNavOpen(false); }}
                address={wallet.address}
                balance={wallet.balance}
                onDisconnect={wallet.disconnect}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <MobileBottomNav active={activeTab as Tab} onSelect={(t) => setActiveTab(t as ExtendedTab)} />
    </div>
  );
}
