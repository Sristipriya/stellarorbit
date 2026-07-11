import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

export type StatCard = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: boolean;
  warn?: boolean;
  ok?: boolean;
};

export function StatsGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const color = c.accent
          ? "text-[var(--orbit-accent)]"
          : c.warn
            ? "text-[var(--orbit-warn)]"
            : c.ok
              ? "text-[var(--orbit-ok)]"
              : "text-[var(--orbit-ink)]";
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
                {c.label}
              </div>
              <Icon className="h-4 w-4 shrink-0 text-[var(--orbit-mute)]/50" />
            </div>
            <div className={`font-display text-2xl font-semibold ${color}`}>{c.value}</div>
            {c.sub && (
              <div className="mt-1 font-mono text-[10px] text-[var(--orbit-mute)]">{c.sub}</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
