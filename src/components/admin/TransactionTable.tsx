import { useState, useMemo } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { type ActivityEvent } from "@/lib/stellar/events";
import { stroopsToXlm, shortAddr, NETWORK } from "@/lib/stellar/network";

type Filter = "all" | "deposit" | "withdraw";

export function TransactionTable({ events }: { events: ActivityEvent[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = events;
    if (filter !== "all") list = list.filter((e) => e.kind === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) => e.address.toLowerCase().includes(q) || e.txHash.toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, filter, search]);

  function exportCsv() {
    const rows = [
      ["Kind", "Address", "Amount (XLM)", "Shares", "TX Hash", "Confirmed", "Timestamp"],
      ...filtered.map((e) => [
        e.kind,
        e.address,
        stroopsToXlm(e.amountStroops),
        stroopsToXlm(e.sharesStroops),
        e.txHash,
        e.confirmed ? "yes" : "pending",
        new Date(e.at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbit-transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="glass rounded-2xl p-5">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)] mr-auto">
          Transactions ({filtered.length})
        </h3>

        {/* Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--orbit-edge)] p-0.5">
          {(["all", "deposit", "withdraw"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all ${
                filter === f
                  ? "bg-[var(--orbit-accent)]/15 text-[var(--orbit-accent)]"
                  : "text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-[var(--orbit-mute)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Address or TX…"
            className="w-36 bg-transparent font-mono text-xs outline-none text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)]"
          />
        </div>

        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center font-mono text-sm text-[var(--orbit-mute)]">
          No transactions found.
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--orbit-edge)] bg-black/20 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {e.kind === "deposit" ? (
                  <ArrowDownToLine className="h-4 w-4 shrink-0 text-[var(--orbit-ok)]" />
                ) : (
                  <ArrowUpFromLine className="h-4 w-4 shrink-0 text-[var(--orbit-warn)]" />
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

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="font-mono text-xs text-[var(--orbit-ink)]">
                    {stroopsToXlm(e.amountStroops)} XLM
                  </div>
                  <div className="font-mono text-[10px] text-[var(--orbit-mute)]">
                    {stroopsToXlm(e.sharesStroops)} shares
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
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
                    {e.txHash.slice(0, 8)}… <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
