import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TopNav } from "@/components/orbit/TopNav";
import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { Hero as AnimatedHero, ShaderBackground } from "@/components/ui/animated-shader-hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbit — Index Vault on Stellar Testnet" },
      {
        name: "description",
        content:
          "Deposit XLM into Orbit's Soroban-powered index vault on Stellar Testnet. Built to grow into a multi-asset RWA index using SEP-40 oracles.",
      },
      { property: "og:title", content: "Orbit — Index Vault on Stellar" },
      {
        property: "og:description",
        content:
          "On-chain index vault on Stellar Testnet. Soroban contract, multi-wallet, real-time activity feed.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen">
      <ShaderBackground />
      <div className="relative z-10">
        <TopNav />
        <AnimatedHero
          trustBadge={{ text: "Soroban · Testnet · Single-Asset Vault" }}
          headline={{ line1: "Index vault for", line2: "on-chain assets" }}
          subtitle="Orbit is a Soroban-powered index vault. Deposit XLM, receive shares, withdraw at share value. Architected to grow into a multi-asset RWA index using SEP-40 oracles."
          buttons={{
            primary: { text: "Enter App →", href: "/app" },
            secondary: {
              text: "View Docs",
              href: "https://developers.stellar.org/docs/build/smart-contracts",
            },
          }}
        />
        <Stats />
        <HowItWorks />
        <BuiltForStellar />
        <Architecture />
        <FAQ />
        <Roadmap />
        <Footer />
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { v: "0.5s", k: "Avg block time" },
    { v: "<$0.01", k: "Tx cost" },
    { v: "100%", k: "On-chain shares" },
    { v: "4", k: "Wallets supported" },
  ];
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden border-x border-[var(--orbit-edge)] bg-[var(--orbit-edge)] md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="bg-black/40 p-8 backdrop-blur-sm">
            <div className="font-display text-4xl text-[var(--orbit-ink)]">{s.v}</div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--orbit-mute)]">
              {s.k}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Architecture() {
  const layers = [
    {
      t: "Frontend",
      d: "TanStack Start · React 19 · Tailwind v4 · Framer Motion. Type-safe routing and SSR-ready.",
    },
    {
      t: "Wallets",
      d: "StellarWalletsKit unifies Freighter, Albedo, xBull and Lobstr behind one signing flow.",
    },
    {
      t: "RPC + Horizon",
      d: "Soroban RPC for contract calls and simulation. Horizon for tx history and event reconciliation.",
    },
    {
      t: "Soroban Vault",
      d: "Rust contract with deposit / withdraw / share math. Unit-tested, ready for mainnet hardening.",
    },
  ];
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionLabel>Architecture</SectionLabel>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Every layer is <span className="text-[var(--orbit-accent)]">verifiable</span>.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {layers.map((l, i) => (
            <motion.div
              key={l.t}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-baseline justify-between">
                <div className="font-display text-2xl">{l.t}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--orbit-mute)]">
                  Layer {i + 1}
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--orbit-mute)]">{l.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    {
      q: "Is this real money?",
      a: "No. Orbit runs on Stellar Testnet. All XLM is test-only and has no market value.",
    },
    {
      q: "How are shares priced?",
      a: "Share price = total_assets / total_shares. The first depositor sets parity 1:1; subsequent deposits mint shares proportional to vault NAV.",
    },
    {
      q: "Can I withdraw anytime?",
      a: "Yes. Burn your shares and receive the underlying XLM at current NAV. No lock-ups, no fees on the testnet contract.",
    },
    {
      q: "What's next?",
      a: "Multi-asset support via SEP-40 oracles, then index rebalancing strategies and RWA collateral integration.",
    },
  ];
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionLabel>Frequently asked</SectionLabel>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[var(--orbit-edge)] bg-[var(--orbit-edge)] md:grid-cols-2">
          {qs.map((item) => (
            <div key={item.q} className="bg-black/40 p-6 backdrop-blur-sm">
              <div className="font-display text-lg text-[var(--orbit-ink)]">{item.q}</div>
              <p className="mt-2 text-sm text-[var(--orbit-mute)]">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// The old Hero component was completely replaced by AnimatedHero in this file.

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest">{label}</div>
      <div className="mt-1 font-display text-base text-[var(--orbit-ink)]">{value}</div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Connect & fund",
      body: "Connect Freighter, Albedo, xBull, or Lobstr. New accounts can fund themselves with Friendbot in one click.",
    },
    {
      n: "02",
      title: "Deposit, receive shares",
      body: "Deposit XLM into the Orbit vault. The Soroban contract mints shares proportional to your deposit.",
    },
    {
      n: "03",
      title: "Withdraw at NAV",
      body: "Burn shares to withdraw your portion of the vault. As assets grow, share price grows with them.",
    },
  ];
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionLabel>How Orbit Works</SectionLabel>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <div className="font-mono text-xs text-[var(--orbit-accent)]">{s.n}</div>
              <div className="mt-3 font-display text-2xl">{s.title}</div>
              <p className="mt-2 text-sm text-[var(--orbit-mute)]">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuiltForStellar() {
  const specs = [
    { k: "Runtime", v: "Soroban" },
    { k: "Network", v: "Testnet" },
    { k: "Wallets", v: "4" },
    { k: "Oracle", v: "SEP-40" },
  ];
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel>Built for Stellar</SectionLabel>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
              One contract today.{" "}
              <span className="text-[var(--orbit-accent)]">RWA index tomorrow.</span>
            </h2>
          </div>
          <Link to="/app" className="liquid-btn-ghost text-sm">
            Open vault <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--orbit-edge)] bg-[var(--orbit-edge)] md:grid-cols-4">
          {specs.map((s) => (
            <div key={s.k} className="bg-[var(--background)] p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--orbit-mute)]">
                {s.k}
              </div>
              <div className="mt-2 font-display text-3xl">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-px grid gap-px overflow-hidden rounded-2xl border border-[var(--orbit-edge)] bg-[var(--orbit-edge)] md:grid-cols-3">
          {[
            { t: "Rust + Soroban", b: "deposit · withdraw · share price" },
            { t: "StellarWalletsKit", b: "Freighter · Albedo · xBull · Lobstr" },
            { t: "Live activity", b: "Horizon events · explorer links" },
          ].map((f) => (
            <div key={f.t} className="bg-[var(--background)] p-6">
              <div className="font-display text-lg">{f.t}</div>
              <div className="mt-1 font-mono text-xs text-[var(--orbit-mute)]">{f.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const items = [
    { level: "L1·L2", title: "Wallet + Vault", state: "Now", done: true },
    { level: "L3", title: "Full Soroban", state: "Next", done: true },
    { level: "L4·L5", title: "RWA Index", state: "Soon", done: false },
    { level: "L6", title: "Mainnet", state: "Future", done: false },
  ];
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionLabel>Trajectory</SectionLabel>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
          From vault to <span className="text-[var(--orbit-warn)]">on-chain index</span>.
        </h2>

        <div className="relative mt-16">
          {/* horizontal track */}
          <div className="absolute left-0 right-0 top-3 h-px bg-[var(--orbit-edge)]" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 0.5 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-3 h-px bg-gradient-to-r from-[var(--orbit-accent)] to-[var(--orbit-warn)]"
          />

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {items.map((it, i) => (
              <motion.div
                key={it.level}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                {/* node */}
                <div
                  className={`relative z-10 h-6 w-6 rounded-full border ${
                    it.done
                      ? "border-[var(--orbit-accent)] bg-[var(--orbit-accent)] shadow-[0_0_20px_var(--orbit-accent)]"
                      : "border-[var(--orbit-edge)] bg-[var(--background)]"
                  }`}
                />
                <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--orbit-mute)]">
                  {it.level} · {it.state}
                </div>
                <div className="mt-1 font-display text-xl">{it.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--orbit-edge)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-8 font-mono text-xs text-[var(--orbit-mute)]">
        <span>orbit · index vault on stellar testnet</span>
        <span>not financial advice · testnet assets only</span>
      </div>
    </footer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-10 bg-[var(--orbit-edge)]" />
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--orbit-mute)]">
        {children}
      </span>
    </div>
  );
}
