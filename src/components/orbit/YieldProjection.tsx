import { motion } from "framer-motion";

export function YieldProjection({
  depositAmount,
  apyBps,
}: {
  depositAmount: number;
  apyBps: bigint; // APY in basis points, e.g. 500 = 5%
}) {
  const amount = depositAmount || 1000;
  const apyPct = Number(apyBps) / 100;
  
  // Calculate standard 6-month projection
  const months = 6;
  const monthlyRate = Math.pow(1 + apyPct / 100, 1 / 12) - 1;
  
  const projectedValues = Array.from({ length: months + 1 }).map((_, i) => {
    return amount * Math.pow(1 + monthlyRate, i);
  });
  const flatValues = Array.from({ length: months + 1 }).map(() => amount);

  // SVG dimensions
  const width = 300;
  const height = 140;
  const padding = 20;
  
  const minVal = amount * 0.95;
  const maxVal = Math.max(...projectedValues) * 1.05;
  const range = maxVal - minVal;

  const getPoints = (values: number[]) => {
    return values
      .map((val, i) => {
        const x = padding + (i / months) * (width - padding * 2);
        const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const projectedPoints = getPoints(projectedValues);
  const flatPoints = getPoints(flatValues);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-[var(--orbit-edge)]/50"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--orbit-mute)]">
            Yield Projection
          </h3>
          <p className="font-mono text-[9px] text-[var(--orbit-mute)] mt-1">
            Deposit Today vs 6 Months Ago
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-semibold text-[var(--orbit-ok)]">
            +{apyPct.toFixed(2)}% APY
          </div>
        </div>
      </div>

      <div className="relative h-[140px] w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Flat line (holding in wallet) */}
          <polyline
            points={flatPoints}
            fill="none"
            stroke="var(--orbit-mute)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-40"
          />
          {/* Projected Yield line */}
          <polyline
            points={projectedPoints}
            fill="none"
            stroke="var(--orbit-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Gradient fill for projected yield */}
          <polygon
            points={`${padding},${height - padding} ${projectedPoints} ${width - padding},${height - padding}`}
            fill="url(#yield-gradient)"
            opacity="0.2"
          />
          <defs>
            <linearGradient id="yield-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--orbit-accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--orbit-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Labels */}
        <div className="absolute top-2 right-4 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--orbit-accent)]">
            <span className="w-2 h-0.5 bg-[var(--orbit-accent)] inline-block" /> Vault Deposit
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--orbit-mute)]">
            <span className="w-2 h-0.5 border-t border-dashed border-[var(--orbit-mute)] inline-block" /> Wallet
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--orbit-edge)]/40 pt-3">
        <div className="font-mono text-[10px] text-[var(--orbit-mute)]">Projected 6M Earnings</div>
        <div className="font-mono text-xs font-semibold text-[var(--orbit-ink)]">
          +{(projectedValues[months] - amount).toFixed(2)} XLM
        </div>
      </div>
    </motion.div>
  );
}
