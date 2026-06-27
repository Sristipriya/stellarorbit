import { Link } from "@tanstack/react-router";
import { OrbitLogo } from "@/components/orbit/OrbitLogo";

export function TopNav({ inApp = false }: { inApp?: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <OrbitLogo size={28} className="transition-transform group-hover:rotate-12" />
          <span className="font-display text-xl font-semibold tracking-tight">orbit</span>
          <span className="ml-2 rounded-full border border-[var(--orbit-edge)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
            testnet
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[var(--orbit-mute)] md:flex">
          <Link to="/" className="hover:text-[var(--orbit-ink)]">
            Home
          </Link>
          <a
            href="https://developers.stellar.org/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--orbit-ink)]"
          >
            Docs
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--orbit-ink)]"
          >
            GitHub
          </a>
        </nav>
        {!inApp ? (
          <Link to="/app" className="liquid-btn text-sm">
            Enter App
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <Link to="/" className="liquid-btn-ghost text-sm">
            ← Home
          </Link>
        )}
      </div>
    </header>
  );
}
