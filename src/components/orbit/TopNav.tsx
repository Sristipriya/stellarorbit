import { Link } from "@tanstack/react-router";

export function TopNav({ inApp = false }: { inApp?: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2">
          <div className="relative h-7 w-7">
            <div className="absolute inset-0 rounded-full border border-[var(--orbit-edge)]" />
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--orbit-accent)] shadow-[0_0_18px_var(--orbit-accent)]" />
            <div className="absolute -right-0.5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[var(--orbit-warn)]" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">orbit</span>
          <span className="ml-2 rounded-full border border-[var(--orbit-edge)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
            testnet
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[var(--orbit-mute)] md:flex">
          <Link to="/" className="hover:text-[var(--orbit-ink)]">Home</Link>
          <a href="https://developers.stellar.org/docs" target="_blank" rel="noreferrer" className="hover:text-[var(--orbit-ink)]">Docs</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[var(--orbit-ink)]">GitHub</a>
        </nav>
        {!inApp ? (
          <Link to="/app" className="liquid-btn text-sm">
            Enter App
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <Link to="/" className="liquid-btn-ghost text-sm">← Home</Link>
        )}
      </div>
    </header>
  );
}