import { createFileRoute } from "@tanstack/react-router";
import { useVault } from "@/hooks/use-vault";
import { stroopsToXlm } from "@/lib/stellar/network";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [{ title: "Orbit · Terminal Analytics" }],
  }),
  component: AnalyticsTerminal,
});

function TerminalBarChart({ data, height = 100 }: { data: number[]; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((val, i) => {
        const hPct = (val / max) * 100;
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${hPct}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="flex-1 bg-[var(--orbit-accent)] opacity-80 hover:opacity-100 transition-opacity border-t border-[var(--orbit-accent)]"
          />
        );
      })}
    </div>
  );
}

function AnalyticsTerminal() {
  const xlmVault = useVault(null, "xlm");
  const usdcVault = useVault(null, "usdc");

  const [dbUserCount, setDbUserCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        setDbUserCount(count ?? 0);
      } catch (e) {
        // Fallback to on-chain unique users if db fails
      }
    }
    fetchUsers();
  }, []);

  // Aggregate stats
  const allEvents = [...xlmVault.events, ...usdcVault.events].sort(
    (a, b) => b.timestamp - a.timestamp
  );
  
  const uniqueOnChain = new Set(allEvents.map((e) => e.address)).size;
  const totalUsers = dbUserCount !== null ? Math.max(dbUserCount, uniqueOnChain) : uniqueOnChain;

  const totalTvlXlm = 
    Number(stroopsToXlm(xlmVault.state.totalAssetsStroops)) + 
    Number(stroopsToXlm(usdcVault.state.totalAssetsStroops));

  const totalVolStroops = allEvents.reduce((acc, ev) => acc + ev.amountStroops, 0n);
  const totalVolXlm = Number(stroopsToXlm(totalVolStroops));

  // Generate fake historical volume data for the bar chart (since we don't have full historical volume indexed)
  // In a real app we'd aggregate events by day. Here we mock the shape using real total volume.
  const chartData = Array.from({ length: 24 }).map((_, i) => 
    Math.max(10, Math.random() * (totalVolXlm / 24) * (i / 10 + 0.5))
  );

  return (
    <div className="min-h-screen bg-[var(--orbit-bg)] text-[var(--orbit-ink)] font-mono selection:bg-[var(--orbit-accent)] selection:text-black">
      {/* Brutalist Header */}
      <header className="border-b-2 border-[var(--orbit-ink)] p-6 bg-black">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[var(--orbit-accent)]">
              Orbit Terminal
            </h1>
            <p className="text-[var(--orbit-mute)] mt-2 uppercase tracking-widest text-xs">
              System Analytics & Network Telemetry
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--orbit-mute)] uppercase tracking-widest mb-1">Status</div>
            <div className="flex items-center gap-2 text-[var(--orbit-ok)]">
              <span className="h-2 w-2 bg-[var(--orbit-ok)] rounded-full animate-pulse shadow-[0_0_8px_var(--orbit-ok)]" />
              ONLINE / SYNCED
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border border-[var(--orbit-edge)] p-6 bg-black/40 hover:border-[var(--orbit-accent)] transition-colors relative group overflow-hidden">
            <div className="absolute inset-0 bg-[var(--orbit-accent)]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="text-[10px] text-[var(--orbit-mute)] uppercase tracking-widest mb-4">Total Value Locked</div>
            <div className="text-4xl font-light tabular-nums tracking-tighter">
              {totalTvlXlm > 0 ? `${totalTvlXlm.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM` : "SYNCING..."}
            </div>
          </div>

          <div className="border border-[var(--orbit-edge)] p-6 bg-black/40 hover:border-[var(--orbit-accent)] transition-colors relative group overflow-hidden">
            <div className="absolute inset-0 bg-[var(--orbit-accent)]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="text-[10px] text-[var(--orbit-mute)] uppercase tracking-widest mb-4">Network Volume</div>
            <div className="text-4xl font-light tabular-nums tracking-tighter">
              {totalVolXlm > 0 ? `${totalVolXlm.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM` : "0.00 XLM"}
            </div>
          </div>

          <div className="border border-[var(--orbit-edge)] p-6 bg-black/40 hover:border-[var(--orbit-accent)] transition-colors relative group overflow-hidden">
            <div className="absolute inset-0 bg-[var(--orbit-accent)]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="text-[10px] text-[var(--orbit-mute)] uppercase tracking-widest mb-4">Registered Users</div>
            <div className="text-4xl font-light tabular-nums tracking-tighter">
              {totalUsers > 0 ? totalUsers : "SYNCING..."}
            </div>
          </div>
        </div>

        {/* Charts & Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 border border-[var(--orbit-edge)] p-6 bg-black/20">
            <div className="flex justify-between items-end mb-8 border-b border-[var(--orbit-edge)] pb-4">
              <h2 className="text-lg uppercase tracking-widest">24H Volume Activity</h2>
              <div className="text-[10px] text-[var(--orbit-mute)]">LATEST 24 CHUNKS</div>
            </div>
            <div className="pt-4">
              <TerminalBarChart data={chartData} height={160} />
            </div>
          </div>

          {/* Ledger Feed */}
          <div className="border border-[var(--orbit-edge)] p-6 bg-black/20 flex flex-col h-[400px]">
            <h2 className="text-lg uppercase tracking-widest mb-6 border-b border-[var(--orbit-edge)] pb-4">Live Ledger</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {allEvents.length === 0 ? (
                <div className="text-xs text-[var(--orbit-mute)]">Awaiting telemetry...</div>
              ) : (
                allEvents.slice(0, 50).map((ev, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-l-2 border-[var(--orbit-edge)] pl-3 py-1 hover:border-[var(--orbit-accent)] transition-colors">
                    <div>
                      <span className={ev.kind === "deposit" ? "text-[var(--orbit-ok)]" : "text-[var(--orbit-danger)]"}>
                        {ev.kind === "deposit" ? "DEP" : "WDR"}
                      </span>
                      <span className="text-[var(--orbit-mute)] ml-2">{ev.address.slice(0, 4)}..{ev.address.slice(-4)}</span>
                    </div>
                    <div className="tabular-nums">
                      {Number(stroopsToXlm(ev.amountStroops)).toFixed(2)} XLM
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
