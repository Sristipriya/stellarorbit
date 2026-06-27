import { useState } from "react";
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
} from "lucide-react";
import { DepositCard } from "./DepositCard";
import { WithdrawCard } from "./WithdrawCard";
import { ActivityFeed } from "./ActivityFeed";
import { FundBanner } from "./FundBanner";
import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { useWallet } from "@/hooks/use-wallet";
import { useVault } from "@/hooks/use-vault";
import { type ActivityEvent } from "@/lib/stellar/events";
import { NETWORK, shortAddr, stroopsToXlm, HAS_REAL_CONTRACT } from "@/lib/stellar/network";
import { type VaultState } from "@/lib/stellar/vault";

// ──────────────────── Types ────────────────────
type Tab = "portfolio" | "deposit" | "withdraw" | "history" | "faucet" | "settings";

// ──────────────────── Helpers ──────────────────
function pricePerShare(state: VaultState): string {
  if (state.totalSharesStroops === 0n) return "1.0000";
  const num = Number(state.totalAssetsStroops);
  const den = Number(state.totalSharesStroops);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return "1.0000";
  return (num / den).toFixed(4);
}

function pnlPercent(state: VaultState): string {
  const price = parseFloat(pricePerShare(state));
  const pnl = ((price - 1) / 1) * 100;
  return pnl >= 0 ? `+${pnl.toFixed(2)}%` : `${pnl.toFixed(2)}%`;
}

// ──────────────────── Pure SVG Sparkline ────────────────────
function SparkLine({ data, color = "oklch(0.82 0.16 195)" }: { data: number[]; color?: string }) {
  const w = 600;
  const h = 120;
  const pad = 8;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  // Area path: go down to bottom-right, across bottom, up to start
  const first = pts[0];
  const last = pts[pts.length - 1];
  const area = `M${first} L${polyline} L${last.split(",")[0]},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height: 140 }}
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* dots at start and end */}
      <circle
        cx={pts[0].split(",")[0]}
        cy={pts[0].split(",")[1]}
        r="4"
        fill={color}
        opacity="0.7"
      />
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r="5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "portfolio", label: "Portfolio", icon: LayoutDashboard },
  { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { id: "history", label: "History", icon: History },
  { id: "faucet", label: "Faucet", icon: Zap },
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
    <div className="flex h-full flex-col border-r border-[var(--orbit-edge)] bg-black/60 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--orbit-accent)] shadow-[0_0_20px_var(--orbit-accent)]">
          <Globe className="h-4 w-4 text-black" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">Orbit</span>
        <span className="ml-auto rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-accent)]">
          Testnet
        </span>
      </div>

      {/* Wallet badge */}
      {address && (
        <div className="mx-3 mb-4 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20">
              <Wallet className="h-3.5 w-3.5 text-[var(--orbit-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] text-[var(--orbit-mute)]">Connected</div>
              <div className="font-mono text-xs text-[var(--orbit-ink)]">{shortAddr(address)}</div>
            </div>
          </div>
          {balance && (
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-[var(--orbit-mute)]">XLM</span>
              <span className="font-display text-base font-semibold text-[var(--orbit-accent)]">
                {Number(balance.xlm).toFixed(4)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[var(--orbit-accent)]/15 text-[var(--orbit-accent)] shadow-[inset_0_0_0_1px_var(--orbit-accent)/30]"
                  : "text-[var(--orbit-mute)] hover:bg-white/[0.04] hover:text-[var(--orbit-ink)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Disconnect */}
      {address && (
        <div className="px-3 pb-5">
          <button
            onClick={onDisconnect}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--orbit-mute)] transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────── Portfolio Tab ────────────────────
function PortfolioTab({
  wallet,
  vault,
}: {
  wallet: ReturnType<typeof useWallet>;
  vault: { state: VaultState; loading: boolean; events: ActivityEvent[]; refresh: () => void };
}) {
  const price = parseFloat(pricePerShare(vault.state));
  const userShares = vault.state.userSharesStroops;
  const totalAssetsStr = stroopsToXlm(vault.state.totalAssetsStroops);
  const totalSharesStr = stroopsToXlm(vault.state.totalSharesStroops);
  const userSharesStr = stroopsToXlm(userShares);
  const underlying =
    vault.state.totalSharesStroops === 0n
      ? 0n
      : (userShares * vault.state.totalAssetsStroops) / vault.state.totalSharesStroops;

  // Fake but plausible mock chart that reflects real price direction
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    t: `${i + 1}h`,
    price: +(price * (1 - 0.02 + (i / 12) * 0.03 + Math.sin(i) * 0.005)).toFixed(5),
  }));

  const cards = [
    {
      label: "Vault Total Assets",
      value: `${totalAssetsStr} XLM`,
      accent: true,
      icon: TrendingUp,
      note: "All depositors combined",
    },
    {
      label: "Total Shares Issued",
      value: totalSharesStr,
      icon: Shield,
      note: "Across all holders",
    },
    {
      label: "Share Price",
      value: `${pricePerShare(vault.state)} XLM`,
      icon: Globe,
      note: pnlPercent(vault.state) + " from parity",
    },
    {
      label: "Your Shares",
      value: userSharesStr,
      icon: Wallet,
      note: `≈ ${stroopsToXlm(underlying)} XLM underlying`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`text-[10px] font-mono uppercase tracking-widest ${c.accent ? "text-[var(--orbit-accent)]" : "text-[var(--orbit-mute)]"}`}
                >
                  {c.label}
                </div>
                <Icon className="h-4 w-4 shrink-0 text-[var(--orbit-mute)]/60" />
              </div>
              <div
                className={`mt-2 font-display text-2xl font-semibold ${c.accent ? "text-[var(--orbit-accent)]" : "text-[var(--orbit-ink)]"}`}
              >
                {c.value}
              </div>
              <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">{c.note}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
            Share Price (simulated trend)
          </h3>
          <span className="font-mono text-[10px] text-[var(--orbit-mute)]">
            {HAS_REAL_CONTRACT ? "live" : "demo"}
          </span>
        </div>
        <SparkLine data={chartData.map((d) => d.price)} />
      </motion.div>

      {/* Recent Activity */}
      <ActivityFeed events={vault.events} />
    </div>
  );
}

// ──────────────────── History Tab ────────────────────
function HistoryTab({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <History className="mx-auto h-10 w-10 text-[var(--orbit-mute)]/40" />
        <div className="mt-4 font-display text-lg">No transactions yet</div>
        <p className="mt-2 text-sm text-[var(--orbit-mute)]">
          Your deposit and withdraw history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
        Transaction History
      </h3>
      <div className="space-y-2">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {e.kind === "deposit" ? (
                <ArrowDownToLine className="h-4 w-4 text-[var(--orbit-ok)]" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4 text-[var(--orbit-warn)]" />
              )}
              <div>
                <div className="font-mono text-xs font-medium capitalize text-[var(--orbit-ink)]">
                  {e.kind}
                </div>
                <div className="font-mono text-[10px] text-[var(--orbit-mute)]">
                  {shortAddr(e.address)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-[var(--orbit-ink)]">
                {e.kind === "deposit"
                  ? `${stroopsToXlm(e.amountStroops)} XLM`
                  : `${stroopsToXlm(e.sharesStroops)} shares`}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {e.confirmed ? (
                  <CheckCircle2 className="h-3 w-3 text-[var(--orbit-ok)]" />
                ) : (
                  <Clock className="h-3 w-3 text-[var(--orbit-warn)]" />
                )}
                <a
                  href={NETWORK.explorerTx(e.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-[10px] text-[var(--orbit-accent)] hover:underline"
                >
                  {e.txHash.slice(0, 8)}…
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────── Faucet Tab ────────────────────
function FaucetTab({ address, onFunded }: { address: string | null; onFunded: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function fund() {
    if (!address) return;
    setStatus("loading");
    try {
      const res = await fetch(`${NETWORK.friendbotUrl}?addr=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTxHash(json.hash ?? null);
      setStatus("ok");
      onFunded();
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
      setStatus("err");
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--orbit-warn)]/20">
            <Zap className="h-5 w-5 text-[var(--orbit-warn)]" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Stellar Friendbot</h3>
            <p className="font-mono text-[11px] text-[var(--orbit-mute)]">
              Fund your Testnet account with 10,000 XLM
            </p>
          </div>
        </div>

        {address ? (
          <div className="mb-4 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2">
            <div className="font-mono text-[10px] text-[var(--orbit-mute)] mb-1">Your address</div>
            <div className="font-mono text-xs break-all text-[var(--orbit-ink)]">{address}</div>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-4 py-3 font-mono text-xs text-[var(--orbit-mute)]">
            Connect your wallet first
          </div>
        )}

        <button
          onClick={fund}
          disabled={!address || status === "loading"}
          className="liquid-btn w-full justify-center"
          style={{
            background:
              "linear-gradient(180deg, oklch(1 0 0 / 0.08), oklch(1 0 0 / 0.02)), color-mix(in oklab, var(--orbit-warn) 22%, transparent)",
          }}
        >
          {status === "loading" ? (
            <>
              <RefreshCcw className="h-4 w-4 animate-spin" /> Requesting XLM…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" /> Fund with Friendbot
            </>
          )}
        </button>

        {status === "ok" && (
          <div className="mt-4 rounded-xl border border-[var(--orbit-ok)]/30 bg-[var(--orbit-ok)]/10 p-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--orbit-ok)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Funded! 10,000 XLM added to your account.
            </div>
            {txHash && (
              <a
                href={NETWORK.explorerTx(txHash)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[var(--orbit-accent)] hover:underline"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
        {status === "err" && (
          <div className="mt-4 rounded-xl border border-[var(--orbit-danger)]/30 bg-[var(--orbit-danger)]/10 p-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--orbit-danger)]">
              <XCircle className="h-4 w-4 shrink-0" />
              {errMsg || "Friendbot request failed. Account may already be funded."}
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--orbit-mute)]" />
          <div>
            <div className="font-display text-sm font-medium">About Testnet Tokens</div>
            <p className="mt-1 text-sm text-[var(--orbit-mute)]">
              Friendbot tokens have no real value. They exist purely to let you test Stellar's
              Soroban smart contract functionality without spending real XLM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────── Receive Tab (shown inside deposit tab) ────────────────────
function ReceivePanel({ address }: { address: string | null }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
        Receive XLM
      </h3>
      {address ? (
        <>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.04]">
              <QrCode className="h-10 w-10 text-[var(--orbit-accent)]" />
            </div>
          </div>
          <div className="mb-3 rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5">
            <div className="font-mono text-[10px] text-[var(--orbit-mute)] mb-1">
              Your wallet address
            </div>
            <div className="font-mono text-xs break-all text-[var(--orbit-ink)]">{address}</div>
          </div>
          <button onClick={copy} className="liquid-btn w-full justify-center">
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy Address"}
          </button>
          <a
            href={NETWORK.explorerAccount(address)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 font-mono text-xs text-[var(--orbit-accent)] hover:underline"
          >
            View on Stellar Explorer <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </>
      ) : (
        <p className="font-mono text-xs text-[var(--orbit-mute)]">
          Connect your wallet to see your address.
        </p>
      )}
    </div>
  );
}

// ──────────────────── Settings Tab ────────────────────
function SettingsTab({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("orbit:display-name") ?? "",
  );
  const [saved, setSaved] = useState(false);

  function saveProfile() {
    localStorage.setItem("orbit:display-name", displayName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4 max-w-lg">
      {/* Profile */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-5 font-display text-base font-semibold">Profile Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Anonymous Explorer"
              className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 font-mono text-sm outline-none focus:border-[var(--orbit-accent)] transition-colors text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)]"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest text-[var(--orbit-mute)] mb-1.5">
              Connected Wallet
            </label>
            <div className="rounded-xl border border-[var(--orbit-edge)] bg-black/30 px-3 py-2.5 font-mono text-xs text-[var(--orbit-mute)] break-all">
              {wallet.address ?? "Not connected"}
            </div>
          </div>

          <button onClick={saveProfile} className="liquid-btn w-full justify-center">
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Saved!
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </div>

      {/* Network Info */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 font-display text-base font-semibold">Network Details</h3>
        <div className="space-y-2">
          {[
            { k: "Network", v: NETWORK.name },
            { k: "Horizon URL", v: NETWORK.horizonUrl },
            { k: "Soroban RPC", v: NETWORK.sorobanRpcUrl },
            { k: "Contract Mode", v: HAS_REAL_CONTRACT ? "Live Contract" : "Demo Mode" },
          ].map(({ k, v }) => (
            <div
              key={k}
              className="flex items-start justify-between gap-4 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-4 py-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)] shrink-0">
                {k}
              </span>
              <span className="font-mono text-[10px] text-right text-[var(--orbit-ink)] break-all">
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      {wallet.address && (
        <div className="glass rounded-2xl border border-[var(--orbit-danger)]/20 p-6">
          <h3 className="mb-3 font-display text-base font-semibold text-[var(--orbit-danger)]">
            Disconnect Wallet
          </h3>
          <p className="mb-4 text-sm text-[var(--orbit-mute)]">
            This removes your wallet connection from Orbit. You can reconnect at any time.
          </p>
          <button
            onClick={wallet.disconnect}
            className="flex items-center gap-2 rounded-xl border border-[var(--orbit-danger)]/40 bg-[var(--orbit-danger)]/10 px-4 py-2.5 font-mono text-sm text-[var(--orbit-danger)] transition-all hover:bg-[var(--orbit-danger)]/20"
          >
            <LogOut className="h-4 w-4" /> Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────── Unauthenticated Banner ────────────────────
function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md rounded-3xl p-10 text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--orbit-accent)]/15">
          <Wallet className="h-8 w-8 text-[var(--orbit-accent)]" />
        </div>
        <div className="font-display text-2xl font-semibold">Connect a Stellar Wallet</div>
        <p className="mt-3 text-sm text-[var(--orbit-mute)]">
          Orbit supports Freighter, Albedo, xBull, and Lobstr on Stellar Testnet. New accounts can
          fund themselves with Friendbot.
        </p>
        <button onClick={onConnect} className="liquid-btn mx-auto mt-7">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </button>
      </motion.div>
    </div>
  );
}

// ──────────────────── Main Dashboard ────────────────────
export function AppDashboard() {
  const wallet = useWallet();
  const vault = useVault(wallet.address);
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showFundBanner = wallet.address && wallet.balance && !wallet.balance.funded;

  function renderContent() {
    if (!wallet.address) {
      return <ConnectPrompt onConnect={wallet.connect} />;
    }

    switch (activeTab) {
      case "portfolio":
        return <PortfolioTab wallet={wallet} vault={vault} />;
      case "deposit":
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <DepositCard
              address={wallet.address}
              state={vault.state}
              walletBalance={wallet.balance?.xlm ?? null}
              onDone={vault.refresh}
            />
            <ReceivePanel address={wallet.address} />
          </div>
        );
      case "withdraw":
        return (
          <div className="max-w-md">
            <WithdrawCard address={wallet.address} state={vault.state} onDone={vault.refresh} />
          </div>
        );
      case "history":
        return <HistoryTab events={vault.events} />;
      case "faucet":
        return (
          <FaucetTab
            address={wallet.address}
            onFunded={() => wallet.refreshBalance(wallet.address!)}
          />
        );
      case "settings":
        return <SettingsTab wallet={wallet} />;
      default:
        return null;
    }
  }

  const pageTitle: Record<Tab, string> = {
    portfolio: "Portfolio",
    deposit: "Deposit & Receive",
    withdraw: "Withdraw",
    history: "Transaction History",
    faucet: "Testnet Faucet",
    settings: "Settings",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Shader-like ambient glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <EtheralShadow
          color="rgba(130, 26, 195, 0.4)"
          animation={{ scale: 100, speed: 60 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
      </div>

      {/* Sidebar (desktop) */}
      <div className="hidden w-60 shrink-0 md:flex md:flex-col">
        <Sidebar
          active={activeTab}
          onSelect={(t) => setActiveTab(t)}
          address={wallet.address}
          balance={wallet.balance}
          onDisconnect={wallet.disconnect}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] bg-black/40 px-6 py-4 backdrop-blur-xl">
          {/* Mobile hamburger */}
          <button
            className="md:hidden mr-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--orbit-edge)] text-[var(--orbit-mute)]"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            ≡
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">
              {pageTitle[activeTab]}
            </h1>
            <p className="font-mono text-[10px] text-[var(--orbit-mute)]">
              {HAS_REAL_CONTRACT
                ? "Soroban contract · Testnet"
                : "Demo mode · real Testnet payments + local share ledger"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {vault.loading && (
              <RefreshCcw className="h-4 w-4 animate-spin text-[var(--orbit-mute)]" />
            )}
            {wallet.address ? (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-[var(--orbit-ok)] shadow-[0_0_8px_var(--orbit-ok)]" />
                <span className="font-mono text-xs text-[var(--orbit-ink)]">
                  {shortAddr(wallet.address)}
                </span>
              </div>
            ) : (
              <button onClick={wallet.connect} className="liquid-btn py-2 text-sm">
                <Wallet className="h-4 w-4" />
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Fund banner */}
        {showFundBanner && wallet.address && (
          <div className="px-6 pt-4">
            <FundBanner
              address={wallet.address}
              onFunded={() => wallet.refreshBalance(wallet.address!)}
            />
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-60 md:hidden"
            >
              <Sidebar
                active={activeTab}
                onSelect={(t) => {
                  setActiveTab(t);
                  setMobileNavOpen(false);
                }}
                address={wallet.address}
                balance={wallet.balance}
                onDisconnect={wallet.disconnect}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
