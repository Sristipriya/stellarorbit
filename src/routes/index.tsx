import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { OrbitMark } from "@/components/orbit/OrbitMark";
import { TopNav } from "@/components/orbit/TopNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbit — Index Vault on Stellar Testnet" },
      { name: "description", content: "Deposit XLM into Orbit's Soroban-powered index vault on Stellar Testnet. Built to grow into a multi-asset RWA index using SEP-40 oracles." },
      { property: "og:title", content: "Orbit — Index Vault on Stellar" },
      { property: "og:description", content: "On-chain index vault on Stellar Testnet. Soroban contract, multi-wallet, real-time activity feed." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <TopNav />
      <Hero />
      <HowItWorks />
      <BuiltForStellar />
      <Roadmap />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 orbit-grid opacity-40" aria-hidden />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--orbit-edge)] bg-black/30 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[var(--orbit-mute)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--orbit-accent)] shadow-[0_0_10px_var(--orbit-accent)]" />
            Soroban · Testnet · Single-Asset Vault
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl"
          >
            Index vault for<br />
            <span className="bg-gradient-to-r from-[var(--orbit-accent)] via-white to-[var(--orbit-warn)] bg-clip-text text-transparent">
              on-chain assets
            </span>
            <br />on Stellar.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-5 max-w-lg text-base text-[var(--orbit-mute)]"
          >
            Orbit is a Soroban-powered index vault. Deposit XLM, receive shares, withdraw at share value.
            Architected to grow into a multi-asset RWA index using SEP-40 oracles.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/app" className="liquid-btn">
              Enter App <span aria-hidden>→</span>
            </Link>
            <a href="https://developers.stellar.org/docs/build/smart-contracts" target="_blank" rel="noreferrer" className="liquid-btn-ghost">
              View Docs
            </a>
          </motion.div>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-4 font-mono text-xs text-[var(--orbit-mute)]">
            <Metric label="Network" value="Testnet" />
            <Metric label="Runtime" value="Soroban" />
            <Metric label="Wallets" value="4+" />
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <OrbitMark size={520} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

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
    { n: "01", title: "Connect & fund", body: "Connect Freighter, Albedo, xBull, or Lobstr. New accounts can fund themselves with Friendbot in one click." },
    { n: "02", title: "Deposit, receive shares", body: "Deposit XLM into the Orbit vault. The Soroban contract mints shares proportional to your deposit." },
    { n: "03", title: "Withdraw at NAV", body: "Burn shares to withdraw your portion of the vault. As assets grow, share price grows with them." },
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
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <SectionLabel>Built for Stellar</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            One contract today.<br />
            <span className="text-[var(--orbit-accent)]">A real RWA index</span> tomorrow.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--orbit-mute)]">
            Orbit ships a single-asset vault on Soroban Testnet today, with a contract shape and frontend
            architecture deliberately chosen so multi-asset RWA tokens and SEP-40 oracle reads slot in
            without rewrites.
          </p>
          <ul className="mt-6 space-y-2 font-mono text-sm text-[var(--orbit-mute)]">
            <li>· Soroban Rust contract — deposit / withdraw / preview_share_price</li>
            <li>· StellarWalletsKit · Freighter, Albedo, xBull, Lobstr</li>
            <li>· Friendbot funding · live activity events · explorer links</li>
            <li>· SEP-40 oracle hook points reserved for L3 NAV computation</li>
          </ul>
        </div>
        <div className="glass rounded-3xl p-8">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-[var(--orbit-mute)]">
{`#[contractimpl]
impl OrbitVault {
  pub fn deposit(env: Env, from: Address, amount: i128) -> i128 {
    from.require_auth();
    let shares = preview_deposit(&env, amount);
    mint(&env, &from, shares);
    state::add_assets(&env, amount);
    env.events().publish((symbol_short!("Dep"),), (from, amount, shares));
    shares
  }

  pub fn withdraw(env: Env, from: Address, shares: i128) -> i128 { /* … */ }
  pub fn balance_of(env: Env, who: Address) -> i128 { /* … */ }
  pub fn preview_share_price(env: Env) -> i128 { /* … */ }
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const items = [
    { level: "L1 · L2", title: "Wallet + Vault on Testnet", body: "Multi-wallet connect, Friendbot funding, Soroban deposit/withdraw, live events.", state: "Now" },
    { level: "L3", title: "Full Soroban Vault", body: "On-chain share math, contract-emitted events, indexed activity feed.", state: "Next" },
    { level: "L4–5", title: "Multi-asset RWA index", body: "BENJI / treasuries, SEP-40 oracle NAV, rebalancing.", state: "Roadmap" },
    { level: "L6", title: "Mainnet", body: "Audits, capacity caps, mainnet deployment.", state: "Future" },
  ];
  return (
    <section className="relative border-t border-[var(--orbit-edge)]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionLabel>Roadmap</SectionLabel>
        <div className="mt-10 grid gap-3 md:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={it.level}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">{it.level}</span>
                <span className="rounded-full border border-[var(--orbit-edge)] px-2 py-0.5 font-mono text-[10px] text-[var(--orbit-accent)]">{it.state}</span>
              </div>
              <div className="mt-3 font-display text-lg">{it.title}</div>
              <p className="mt-1 text-sm text-[var(--orbit-mute)]">{it.body}</p>
            </motion.div>
          ))}
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
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--orbit-mute)]">{children}</span>
    </div>
  );
}
