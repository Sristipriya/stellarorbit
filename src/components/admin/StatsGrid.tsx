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
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const cssColor = c.accent
          ? "var(--orbit-accent)"
          : c.warn
          ? "var(--orbit-warn)"
          : c.ok
          ? "var(--orbit-ok)"
          : "var(--orbit-ink)";

        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
            className="orbit-card relative overflow-hidden p-5"
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
          >
            {/* Accent glow */}
            <div
              className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full blur-xl opacity-25"
              style={{ background: cssColor }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">
                  {c.label}
                </span>
                <Icon className="h-3.5 w-3.5 opacity-40 shrink-0" style={{ color: cssColor }} />
              </div>
              <div
                className="font-display text-2xl font-bold tracking-tight"
                style={{ color: cssColor }}
              >
                {c.value}
              </div>
              {c.sub && (
                <div className="mt-1 font-mono text-[9px] text-[var(--orbit-mute)]">{c.sub}</div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
