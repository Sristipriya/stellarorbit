import { motion } from "framer-motion";

/** Animated orbit visual: a core "vault" planet with nodes orbiting around it. */
export function OrbitMark({ size = 480 }: { size?: number }) {
  const rings = [
    { r: 96, dur: 18, count: 1, color: "var(--orbit-accent)" },
    { r: 150, dur: 28, count: 2, color: "var(--orbit-warn)" },
    { r: 210, dur: 44, count: 3, color: "var(--orbit-accent)" },
  ];
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      {/* Glow core */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.22,
          height: size * 0.22,
          background:
            "radial-gradient(circle at 30% 30%, oklch(0.95 0.05 195), oklch(0.55 0.16 195) 60%, oklch(0.2 0.05 260) 100%)",
          boxShadow:
            "0 0 80px 10px color-mix(in oklab, var(--orbit-accent) 40%, transparent), inset -10px -16px 30px oklch(0 0 0 / 0.6)",
        }}
      />
      {/* Concentric orbit rings + nodes */}
      {rings.map((ring, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: ring.r * 2,
            height: ring.r * 2,
            marginLeft: -ring.r,
            marginTop: -ring.r,
            border: "1px dashed oklch(1 0 0 / 0.12)",
          }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: ring.count }).map((_, n) => {
              const angle = (n / ring.count) * Math.PI * 2;
              const x = Math.cos(angle) * ring.r;
              const y = Math.sin(angle) * ring.r;
              return (
                <div
                  key={n}
                  className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
                  style={{
                    transform: `translate(${x - 6}px, ${y - 6}px)`,
                    background: ring.color,
                    boxShadow: `0 0 18px 2px ${ring.color}`,
                  }}
                />
              );
            })}
          </motion.div>
        </div>
      ))}
      {/* Outer faint ring */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size * 0.96,
          height: size * 0.96,
          marginLeft: -size * 0.48,
          marginTop: -size * 0.48,
          border: "1px solid oklch(1 0 0 / 0.05)",
        }}
      />
    </div>
  );
}