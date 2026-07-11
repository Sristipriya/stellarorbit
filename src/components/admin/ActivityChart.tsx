import { useMemo } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { type ActivityEvent } from "@/lib/stellar/events";
import { stroopsToXlm } from "@/lib/stellar/network";

/** Bar chart of deposit vs withdrawal volume, bucketed by day. */
export function ActivityChart({ events }: { events: ActivityEvent[] }) {
  const bars = useMemo(() => {
    if (events.length === 0) return [];
    // Build last 7 day buckets
    const now = Date.now();
    const DAY = 86_400_000;
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const start = now - (6 - i) * DAY;
      const end = start + DAY;
      const label = new Date(start).toLocaleDateString("en", { weekday: "short" });
      let dep = 0;
      let wd = 0;
      for (const ev of events) {
        if (ev.at >= start && ev.at < end) {
          if (ev.kind === "deposit") dep += Number(ev.amountStroops) / 1e7;
          else wd += Number(ev.amountStroops) / 1e7;
        }
      }
      return { label, dep, wd };
    });
    const maxVal = Math.max(...buckets.map((b) => Math.max(b.dep, b.wd)), 1);
    return buckets.map((b) => ({ ...b, depH: (b.dep / maxVal) * 100, wdH: (b.wd / maxVal) * 100 }));
  }, [events]);

  if (bars.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
          Volume — Last 7 Days
        </h3>
        <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--orbit-mute)]">
          <span className="flex items-center gap-1">
            <ArrowDownToLine className="h-3 w-3 text-[var(--orbit-ok)]" /> Deposits
          </span>
          <span className="flex items-center gap-1">
            <ArrowUpFromLine className="h-3 w-3 text-[var(--orbit-warn)]" /> Withdrawals
          </span>
        </div>
      </div>

      <div className="flex items-end gap-2 h-32">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-0.5" style={{ height: 100 }}>
              <div
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${b.depH}%`,
                  background: "var(--orbit-ok)",
                  opacity: 0.7,
                  minHeight: b.dep > 0 ? 4 : 0,
                }}
              />
              <div
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${b.wdH}%`,
                  background: "var(--orbit-warn)",
                  opacity: 0.7,
                  minHeight: b.wd > 0 ? 4 : 0,
                }}
              />
            </div>
            <div className="font-mono text-[9px] text-[var(--orbit-mute)]">{b.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-4 font-mono text-[10px] text-[var(--orbit-mute)]">
        <span>
          Total Deposits:{" "}
          <span className="text-[var(--orbit-ok)]">
            {stroopsToXlm(
              events.filter((e) => e.kind === "deposit").reduce((s, e) => s + e.amountStroops, 0n),
            )}{" "}
            XLM
          </span>
        </span>
        <span>
          Total Withdrawals:{" "}
          <span className="text-[var(--orbit-warn)]">
            {stroopsToXlm(
              events.filter((e) => e.kind === "withdraw").reduce((s, e) => s + e.amountStroops, 0n),
            )}{" "}
            XLM
          </span>
        </span>
      </div>
    </div>
  );
}
