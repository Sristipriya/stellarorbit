/** Orbit logo — minimal geometric mark: a tilted ring with an offset orbiting dot. */
export function OrbitLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="orbit-ring" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--orbit-accent)" />
          <stop offset="100%" stopColor="var(--orbit-warn)" />
        </linearGradient>
        <radialGradient id="orbit-core" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="oklch(0.97 0.04 195)" />
          <stop offset="60%" stopColor="var(--orbit-accent)" />
          <stop offset="100%" stopColor="oklch(0.25 0.05 260)" />
        </radialGradient>
      </defs>
      {/* tilted elliptical orbit */}
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="6"
        transform="rotate(-28 16 16)"
        stroke="url(#orbit-ring)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* core */}
      <circle cx="16" cy="16" r="4.2" fill="url(#orbit-core)" />
      {/* orbiting node */}
      <circle cx="27.5" cy="11" r="1.8" fill="var(--orbit-warn)" />
      <circle cx="27.5" cy="11" r="3.6" fill="var(--orbit-warn)" opacity="0.18" />
    </svg>
  );
}
