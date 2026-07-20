import { createFileRoute } from "@tanstack/react-router";
import { useVault } from "@/hooks/use-vault";
import { stroopsToXlm } from "@/lib/stellar/network";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { fetchXlmUsdPrice } from "@/lib/oracle-price";
import { useWallet } from "@/hooks/use-wallet";
import { shortAddr } from "@/lib/stellar/network";
import {
  TrendingUp, Users, Activity, DollarSign, ArrowDownToLine, ArrowUpFromLine,
  ExternalLink, Zap, RefreshCcw, BarChart2, Globe
} from "lucide-react";
import { NETWORK } from "@/lib/stellar/network";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [{ title: "Orbit · Protocol Analytics" }],
  }),
  component: AnalyticsPage,
});

// ── Animated counter ──
function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = start + (value - start) * eased;
      setCurrent(val);
      ref.current = val;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{current.toLocaleString(undefined, { maximumFractionDigits: 2 })}</>;
}

// ── Real bar chart (no random data) ──
function DailyVolumeChart({ events }: { events: any[] }) {
  const now = Date.now();
  const days = 14;
  const buckets: Record<string, { dep: number; wd: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { dep: 0, wd: 0 };
  }

  for (const ev of events) {
    const d = new Date(ev.at ?? now);
    const key = d.toISOString().slice(0, 10);
    if (buckets[key]) {
      if (ev.kind === "deposit") buckets[key].dep += Number(stroopsToXlm(ev.amountStroops));
      else buckets[key].wd += Number(stroopsToXlm(ev.amountStroops));
    }
  }

  const sortedDays = Object.keys(buckets).sort();
  const maxVal = Math.max(...sortedDays.map((d) => buckets[d].dep + buckets[d].wd), 1);

  return (
    <div>
      <div className="flex items-end gap-1.5 w-full" style={{ height: 140 }}>
        {sortedDays.map((day, i) => {
          const depH = (buckets[day].dep / maxVal) * 100;
          const wdH = (buckets[day].wd / maxVal) * 100;
          const total = depH + wdH;
          return (
            <div key={day} className="flex flex-1 flex-col items-center gap-0.5 group relative">
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center">
                <div className="bg-black border border-[var(--orbit-edge)] rounded-lg px-2 py-1.5 text-[9px] font-mono whitespace-nowrap">
                  <div className="text-[var(--orbit-ok)]">+{buckets[day].dep.toFixed(1)} DEP</div>
                  <div className="text-[var(--orbit-warn)]">-{buckets[day].wd.toFixed(1)} WD</div>
                </div>
                <div className="w-px h-2 bg-[var(--orbit-edge)]" />
              </div>
              <div className="flex flex-col justify-end w-full" style={{ height: 130 }}>
                {wdH > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${wdH}%` }}
                    transition={{ duration: 0.6, delay: i * 0.03 }}
                    className="w-full rounded-t-sm"
                    style={{ background: "var(--orbit-warn)", opacity: 0.7 }}
                  />
                )}
                {depH > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${depH}%` }}
                    transition={{ duration: 0.6, delay: i * 0.03 + 0.1 }}
                    className="w-full"
                    style={{ background: "var(--orbit-ok)", opacity: total === 0 ? 0.1 : 0.8 }}
                  />
                )}
                {total === 0 && (
                  <div className="w-full" style={{ height: "4%", background: "var(--orbit-edge)" }} />
                )}
              </div>
              <div className="font-mono text-[7px] text-[var(--orbit-mute)] rotate-0 truncate w-full text-center">
                {day.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest text-[var(--orbit-mute)]">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-sm bg-[var(--orbit-ok)] opacity-80" />
          Deposits
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-sm bg-[var(--orbit-warn)] opacity-70" />
          Withdrawals
        </div>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const xlmVault = useVault(null, "xlm");
  const { address } = useWallet();
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [xlmUsd, setXlmUsd] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
    fetchXlmUsdPrice().then(setXlmUsd);
  }, []);

  async function load() {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_address, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setDbUsers(data);
    } catch {}
    setRefreshing(false);
  }

  const events = xlmVault.events;
  const deposits = events.filter((e) => e.kind === "deposit");
  const withdrawals = events.filter((e) => e.kind === "withdraw");
  const totalDepVol = deposits.reduce((s, e) => s + e.amountStroops, 0n);
  const totalWdVol = withdrawals.reduce((s, e) => s + e.amountStroops, 0n);

  const tvlXlm = Number(stroopsToXlm(xlmVault.state.totalAssetsStroops));
  const tvlUsd = xlmUsd ? tvlXlm * xlmUsd : null;

  // Build user roster from on-chain events + supabase profiles
  const onChainUsers = new Map<string, { dep: bigint; wd: bigint; txCount: number; lastAt: number }>();
  for (const ev of events) {
    const u = onChainUsers.get(ev.address) ?? { dep: 0n, wd: 0n, txCount: 0, lastAt: 0 };
    if (ev.kind === "deposit") u.dep += ev.amountStroops;
    else u.wd += ev.amountStroops;
    u.txCount++;
    u.lastAt = Math.max(u.lastAt, ev.at ?? 0);
    onChainUsers.set(ev.address, u);
  }

  const uniqueOnChain = onChainUsers.size;
  const dbCount = dbUsers.length;
  const totalUsers = Math.max(uniqueOnChain, dbCount);

  // Merge into user roster
  const roster = Array.from(onChainUsers.entries()).map(([addr, stats]) => {
    const profile = dbUsers.find((u) => u.wallet_address === addr);
    return {
      address: addr,
      name: profile?.display_name || null,
      dep: stats.dep,
      wd: stats.wd,
      txCount: stats.txCount,
      lastAt: stats.lastAt,
      isMe: addr === address,
    };
  }).sort((a, b) => Number(b.dep - a.dep));

  const apyPct = xlmVault.state.apyBps > 0n ? Number(xlmVault.state.apyBps) / 100 : 5.25;

  const kpis = [
    { label: "Total Value Locked", value: tvlXlm, suffix: " XLM", sub: tvlUsd ? `≈ $${tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "Live on-chain", icon: TrendingUp, accent: true },
    { label: "Total Volume", value: Number(stroopsToXlm(totalDepVol + totalWdVol)), suffix: " XLM", sub: `${events.length} transactions`, icon: Activity },
    { label: "Depositors", value: totalUsers, suffix: "", sub: `${uniqueOnChain} on-chain wallets`, icon: Users, ok: true },
    { label: "Live APY", value: apyPct, suffix: "%", sub: "7-day annualized", icon: Zap, warn: true },
    { label: "Total Deposits", value: Number(stroopsToXlm(totalDepVol)), suffix: " XLM", sub: `${deposits.length} txns`, icon: ArrowDownToLine },
    { label: "Total Withdrawals", value: Number(stroopsToXlm(totalWdVol)), suffix: " XLM", sub: `${withdrawals.length} txns`, icon: ArrowUpFromLine },
  ];

  return (
    <div className="min-h-screen text-[var(--orbit-ink)]" style={{ background: "oklch(0.09 0.012 260)", fontFamily: "var(--font-mono)" }}>
      {/* Header */}
      <header className="border-b border-[var(--orbit-edge)] bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--orbit-accent)] shadow-[0_0_20px_var(--orbit-accent-soft)]">
                <Globe className="h-4 w-4 text-black" />
              </div>
              <span className="font-display text-base font-bold">orbit</span>
            </a>
            <div className="h-4 w-px bg-[var(--orbit-edge)]" />
            <div>
              <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-[var(--orbit-ink)]">
                Protocol Analytics
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
                Real on-chain data · Stellar Testnet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--orbit-ok)]">
              <span className="live-dot" />
              LIVE
            </div>
            <button
              onClick={load}
              disabled={refreshing}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--orbit-edge)] text-[var(--orbit-mute)] hover:border-[var(--orbit-accent)] hover:text-[var(--orbit-accent)] transition-all"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {xlmUsd && (
              <div className="font-mono text-[10px] text-[var(--orbit-warn)] border border-[var(--orbit-warn)]/30 rounded-lg px-2.5 py-1">
                XLM ${xlmUsd.toFixed(4)}
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] px-3 py-1.5 font-mono text-[10px]">
                <span className="live-dot" />
                {shortAddr(address)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            const color = kpi.accent ? "var(--orbit-accent)" : kpi.ok ? "var(--orbit-ok)" : kpi.warn ? "var(--orbit-warn)" : "var(--orbit-ink)";
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                className="orbit-card p-4 relative overflow-hidden"
              >
                <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full blur-xl opacity-20" style={{ background: color }} />
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-mute)]">{kpi.label}</span>
                  <Icon className="h-3.5 w-3.5 opacity-40" style={{ color }} />
                </div>
                <div className="font-display text-xl font-bold" style={{ color }}>
                  <AnimatedCounter value={kpi.value} />
                  {kpi.suffix}
                </div>
                <div className="mt-0.5 font-mono text-[8px] text-[var(--orbit-mute)]">{kpi.sub}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Volume chart */}
          <div className="lg:col-span-2 orbit-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-sm font-semibold">14-Day Volume Activity</h2>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mt-0.5">
                  Real on-chain deposits & withdrawals
                </p>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--orbit-ok)]">
                <BarChart2 className="h-3.5 w-3.5" />
                {events.length} total txns
              </div>
            </div>
            <DailyVolumeChart events={events} />
          </div>

          {/* Live ledger */}
          <div className="orbit-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-semibold">Live Ledger</h2>
              <div className="flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="font-mono text-[9px] text-[var(--orbit-ok)]">SYNCING</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
              {events.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="font-mono text-xs text-[var(--orbit-mute)]">Awaiting transactions…</p>
                </div>
              ) : (
                events.slice(0, 30).map((ev, i) => (
                  <motion.div
                    key={ev.id || i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--orbit-edge)] bg-white/[0.02] px-3 py-2 hover:border-[var(--orbit-accent)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-mono text-[9px] font-bold uppercase ${ev.kind === "deposit" ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-warn)]"}`}>
                        {ev.kind === "deposit" ? "DEP" : "WDR"}
                      </span>
                      <span className="font-mono text-[9px] text-[var(--orbit-mute)] truncate">
                        {ev.address.slice(0, 6)}…{ev.address.slice(-4)}
                      </span>
                    </div>
                    <a
                      href={NETWORK.explorerTx(ev.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[9px] text-[var(--orbit-ink)] hover:text-[var(--orbit-accent)] whitespace-nowrap flex items-center gap-0.5"
                    >
                      {Number(stroopsToXlm(ev.amountStroops)).toFixed(2)} XLM
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Roster */}
        <div className="orbit-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-sm font-semibold">User Roster</h2>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mt-0.5">
                All wallets that have interacted with the vault
              </p>
            </div>
            <span className="font-mono text-[10px] text-[var(--orbit-accent)] border border-[var(--orbit-accent)]/30 rounded-full px-2.5 py-1">
              {totalUsers} wallets
            </span>
          </div>

          {roster.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--orbit-edge)] bg-white/[0.02]">
              <p className="font-mono text-xs text-[var(--orbit-mute)]">No transactions yet. Be the first depositor!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--orbit-edge)]">
                    {["#", "Wallet", "Name", "Total Deposited", "Total Withdrawn", "Net", "Txns", ""].map((h) => (
                      <th key={h} className="pb-3 pr-4 font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roster.slice(0, 20).map((user, i) => {
                    const net = user.dep - user.wd;
                    return (
                      <motion.tr
                        key={user.address}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-[var(--orbit-edge)]/50 hover:bg-white/[0.02] transition-colors ${user.isMe ? "bg-[var(--orbit-accent)]/5" : ""}`}
                      >
                        <td className="py-3 pr-4 font-mono text-[10px] text-[var(--orbit-mute)]">{i + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {user.isMe && <span className="live-dot" />}
                            <span className={`font-mono text-xs ${user.isMe ? "text-[var(--orbit-accent)] font-bold" : "text-[var(--orbit-ink)]"}`}>
                              {shortAddr(user.address)}
                            </span>
                            {user.isMe && (
                              <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--orbit-accent)] bg-[var(--orbit-accent)]/10 px-1.5 py-0.5 rounded-full">you</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-[10px] text-[var(--orbit-mute)]">
                          {user.name || "—"}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-[var(--orbit-ok)]">
                          +{Number(stroopsToXlm(user.dep)).toFixed(2)} XLM
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-[var(--orbit-warn)]">
                          -{Number(stroopsToXlm(user.wd)).toFixed(2)} XLM
                        </td>
                        <td className={`py-3 pr-4 font-mono text-xs font-bold ${net >= 0n ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"}`}>
                          {net >= 0n ? "+" : ""}{Number(stroopsToXlm(net > 0n ? net : -net)).toFixed(2)} XLM
                        </td>
                        <td className="py-3 pr-4 font-mono text-[10px] text-[var(--orbit-mute)]">{user.txCount}</td>
                        <td className="py-3">
                          <a
                            href={NETWORK.explorerAccount(user.address)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[9px] text-[var(--orbit-accent)] hover:underline flex items-center gap-0.5"
                          >
                            Explorer <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Protocol Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="orbit-card p-5">
            <h3 className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-3">Protocol Info</h3>
            <div className="space-y-2">
              {[
                { k: "Network", v: "Stellar Testnet" },
                { k: "Contract Mode", v: "Soroban + Demo" },
                { k: "Oracle", v: "SEP-40 (XLM/USD)" },
                { k: "Share Token", v: "ERC-4626 style" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--orbit-mute)]">{k}</span>
                  <span className="text-[var(--orbit-ink)]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="orbit-card p-5">
            <h3 className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-3">Deposit Stats</h3>
            <div className="space-y-2">
              {[
                { k: "Total Deposits", v: `${deposits.length} txns` },
                { k: "Avg Deposit", v: deposits.length > 0 ? `${(Number(stroopsToXlm(totalDepVol)) / deposits.length).toFixed(2)} XLM` : "—" },
                { k: "Largest", v: deposits.length > 0 ? `${Math.max(...deposits.map(d => Number(stroopsToXlm(d.amountStroops)))).toFixed(2)} XLM` : "—" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--orbit-mute)]">{k}</span>
                  <span className="text-[var(--orbit-ok)] font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="orbit-card p-5">
            <h3 className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)] mb-3">Vault Health</h3>
            <div className="space-y-2">
              {[
                { k: "NAV/Share", v: `${xlmVault.state.totalSharesStroops > 0n ? (Number(stroopsToXlm(xlmVault.state.totalAssetsStroops)) / Number(stroopsToXlm(xlmVault.state.totalSharesStroops))).toFixed(6) : "1.000000"} XLM` },
                { k: "APY", v: `${apyPct.toFixed(2)}%` },
                { k: "XLM/USD", v: xlmUsd ? `$${xlmUsd.toFixed(4)}` : "Loading…" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--orbit-mute)]">{k}</span>
                  <span className="text-[var(--orbit-warn)] font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
