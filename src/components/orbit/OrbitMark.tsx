import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

/** Animated orbit visual: a core "vault" planet with nodes orbiting around it, now in interactive 3D. */
export function OrbitMark({ size = 480 }: { size?: number }) {
  const rings = [
    { r: 96, dur: 18, count: 1, color: "var(--orbit-accent)", z: 60 },
    { r: 150, dur: 28, count: 2, color: "var(--orbit-warn)", z: 30 },
    { r: 210, dur: 44, count: 3, color: "var(--orbit-accent)", z: -20 },
  ];

  // Mouse position state for 3D rotation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the mouse movement using springs
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Map mouse position to rotation angles (max 25 degrees)
  const rotateX = useTransform(springY, [-0.5, 0.5], [25, -25]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-25, 25]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      className="relative cursor-pointer"
      style={{ width: size, height: size, perspective: 1200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
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
            transform: "translateZ(80px) translateX(-50%) translateY(-50%)",
            transformOrigin: "center center",
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
              border: "1px dashed oklch(1 0 0 / 0.2)",
              transform: `translateZ(${ring.z}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ rotateZ: 360 }}
              transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {Array.from({ length: ring.count }).map((_, n) => {
                const angle = (n / ring.count) * Math.PI * 2;
                const x = Math.round(Math.cos(angle) * ring.r * 1000) / 1000;
                const y = Math.round(Math.sin(angle) * ring.r * 1000) / 1000;
                return (
                  <div
                    key={n}
                    className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
                    style={{
                      transform: `translate(${x - 6}px, ${y - 6}px) translateZ(10px)`,
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
            transform: "translateZ(-60px)",
          }}
        />
      </motion.div>
    </div>
  );
}
