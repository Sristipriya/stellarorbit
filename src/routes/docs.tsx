import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/orbit/TopNav";
import { ShaderBackground } from "@/components/ui/animated-shader-hero";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import {
  BookOpen,
  ShieldCheck,
  Layers,
  ArrowRightLeft,
  DollarSign,
  Cpu,
  Copy,
  ExternalLink,
  Check,
  Code,
  Zap,
  FileText,
  Lock,
  ChevronRight,
  ChevronLeft,
  Search,
  Terminal,
  Activity,
  Award,
  Sparkles,
  Server,
  KeyRound,
  Coins,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  ORBIT_VAULT_CONTRACT_ID,
  ORBIT_YIELD_STRATEGY_ID,
  ORBIT_OXLM_SHARE_TOKEN_ID,
  ORBIT_TRANCHE_CONTRACT_ID,
  ORBIT_PT_TOKEN_ID,
  ORBIT_YT_TOKEN_ID,
  ORBIT_MARKET_CONTRACT_ID,
  ORBIT_POINTS_CONTRACT_ID,
  ORBIT_ZAP_ROUTER_ID,
  ORBIT_USDC_CONTRACT_ID,
  ORBIT_INDEX_CONTRACT_ID,
} from "@/lib/stellar/network";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Orbit Protocol" },
      {
        name: "description",
        content:
          "Comprehensive technical documentation, contract specifications, NAV formulas, yield tranching mechanics, and developer guides for Orbit Protocol on Stellar Soroban.",
      },
    ],
  }),
  component: DocumentationPage,
});

interface ContractEntry {
  name: string;
  id: string;
  role: string;
  category: "Core Vault" | "Tranching" | "Market & Router" | "Tokens & Mock";
}

const CONTRACTS: ContractEntry[] = [
  {
    name: "Orbit XLM Vault",
    id: ORBIT_VAULT_CONTRACT_ID,
    role: "Core Yield Vault & NAV Accounting",
    category: "Core Vault",
  },
  {
    name: "Auto-Compounding Strategy",
    id: ORBIT_YIELD_STRATEGY_ID,
    role: "Automated Blend Protocol Yield Harvester",
    category: "Core Vault",
  },
  {
    name: "oXLM Share Token",
    id: ORBIT_OXLM_SHARE_TOKEN_ID,
    role: "SEP-41 Compliant Vault Share Token",
    category: "Core Vault",
  },
  {
    name: "Orbit Tranche v2",
    id: ORBIT_TRANCHE_CONTRACT_ID,
    role: "Yield Stripping (PT + YT Tokenization Engine)",
    category: "Tranching",
  },
  {
    name: "PT Token (Principal)",
    id: ORBIT_PT_TOKEN_ID,
    role: "Fixed Nominal Value Principal Token",
    category: "Tranching",
  },
  {
    name: "YT Token (Yield)",
    id: ORBIT_YT_TOKEN_ID,
    role: "Floating Variable Yield Claim Token",
    category: "Tranching",
  },
  {
    name: "P2P Money Market",
    id: ORBIT_MARKET_CONTRACT_ID,
    role: "Escrow-Based Collateralized Lending Market",
    category: "Market & Router",
  },
  {
    name: "Orbit Zap Router",
    id: ORBIT_ZAP_ROUTER_ID,
    role: "Atomic Multi-Asset Swap & Deposit Router",
    category: "Market & Router",
  },
  {
    name: "Orbit Points Engine",
    id: ORBIT_POINTS_CONTRACT_ID,
    role: "Gamification & On-Chain Referral Registry",
    category: "Market & Router",
  },
  {
    name: "Test USDC",
    id: ORBIT_USDC_CONTRACT_ID,
    role: "P2P Market Settlement Currency",
    category: "Tokens & Mock",
  },
  {
    name: "Test INDEX",
    id: ORBIT_INDEX_CONTRACT_ID,
    role: "Diversified Asset Basket Mock Token",
    category: "Tokens & Mock",
  },
];

interface DocTopic {
  id: string;
  title: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const TOPICS: DocTopic[] = [
  {
    id: "overview",
    title: "Protocol Overview",
    badge: "Architecture",
    icon: BookOpen,
    description: "Core mission, institutional yield design, and 4-tier DeFi system architecture on Stellar.",
  },
  {
    id: "vaults",
    title: "Smart Vault Mechanics",
    badge: "SEP-41 Vault",
    icon: Layers,
    description: "NAV formula, share minting math, auto-compounding strategy, and Blend Protocol integration.",
  },
  {
    id: "tranching",
    title: "Yield Tranching (PT & YT)",
    badge: "Structured Finance",
    icon: ArrowRightLeft,
    description: "Splitting vault shares into Principal Tokens (PT) and Yield Tokens (YT) with zero impermanent loss.",
  },
  {
    id: "market",
    title: "P2P Money Market",
    badge: "Lending Escrow",
    icon: DollarSign,
    description: "Fixed-term collateralized loans, escrow enforcement, and zero-liquidation bot architecture.",
  },
  {
    id: "zap-points",
    title: "Zap Router & Points",
    badge: "Router & Rewards",
    icon: Zap,
    description: "Atomic cross-asset swaps, allowance execution, and gamified points referral multiplier engine.",
  },
  {
    id: "security",
    title: "Security & Auth Stack",
    badge: "Security & SIWS",
    icon: ShieldCheck,
    description: "Soroban require_auth, SEP-40 oracles, ed25519 authentication, and Supabase isolation.",
  },
  {
    id: "contracts",
    title: "Deployed Contracts",
    badge: "Testnet Registry",
    icon: Code,
    description: "Verified contract addresses, WASM hashes, explorer links, and Soroban CLI deployment manifests.",
  },
  {
    id: "devguide",
    title: "Developer & SDK Guide",
    badge: "Integration API",
    icon: Terminal,
    description: "CLI build instructions, JS/TS SDK client invocations, React hooks, and Friendbot integration.",
  },
];

function CodeBlock({ code, language = "rust" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-4 overflow-hidden rounded-2xl border border-[var(--orbit-edge)] bg-black/60 font-mono text-xs shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] bg-white/[0.02] px-4 py-2 text-[11px] text-[var(--orbit-mute)]">
        <span className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[var(--orbit-accent)]" /> {language}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--orbit-ok)]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[var(--orbit-ink)] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DocumentationPage() {
  const [activeTopicId, setActiveTopicId] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeTopicIndex = TOPICS.findIndex((t) => t.id === activeTopicId);
  const activeTopic = TOPICS[activeTopicIndex] || TOPICS[0];

  const prevTopic = activeTopicIndex > 0 ? TOPICS[activeTopicIndex - 1] : null;
  const nextTopic = activeTopicIndex < TOPICS.length - 1 ? TOPICS[activeTopicIndex + 1] : null;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return TOPICS;
    const q = searchQuery.toLowerCase();
    return TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const copyAddress = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative min-h-screen text-[var(--orbit-ink)]">
      <ShaderBackground />
      <div className="relative z-10">
        <TopNav />

        {/* Documentation Header Banner */}
        <header className="border-b border-[var(--orbit-edge)] bg-black/40 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-3 py-1 font-mono text-xs text-[var(--orbit-accent)] mb-3">
                  <FileText className="h-3.5 w-3.5" /> Orbit Technical Documentation v2.0
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Orbit Protocol Documentation
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[var(--orbit-mute)]">
                  Complete architectural guide to Orbit’s Soroban smart contracts, SEP-41 share tokens, yield tranching mechanisms, and P2P lending money markets on Stellar.
                </p>
              </div>

              {/* Search Box */}
              <div className="w-full md:w-72">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--orbit-mute)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search docs (e.g. NAV, PT, P2P)..."
                    className="w-full rounded-xl border border-[var(--orbit-edge)] bg-black/50 pl-10 pr-4 py-2.5 font-mono text-xs text-white placeholder-[var(--orbit-mute)] focus:border-[var(--orbit-accent)] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Documentation Container */}
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="sticky top-24 space-y-1.5 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-3 backdrop-blur-xl">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
                    Documentation Topics
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[9px] text-[var(--orbit-accent)]">
                    {filteredTopics.length} Topics
                  </span>
                </div>

                <div className="space-y-1">
                  {filteredTopics.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeTopicId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveTopicId(sec.id);
                          window.scrollTo({ top: 180, behavior: "smooth" });
                        }}
                        className={`group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                          isActive
                            ? "bg-[var(--orbit-accent)]/15 text-[var(--orbit-accent)] border border-[var(--orbit-accent)]/30 shadow-[0_0_20px_var(--orbit-accent-soft)]"
                            : "text-[var(--orbit-mute)] hover:bg-white/[0.03] hover:text-white border border-transparent"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isActive
                              ? "bg-[var(--orbit-accent)] text-black"
                              : "bg-white/[0.04] text-[var(--orbit-mute)] group-hover:text-white"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-semibold truncate">{sec.title}</span>
                          </div>
                          <span
                            className={`font-mono text-[9px] uppercase tracking-wider block mt-0.5 ${
                              isActive ? "text-[var(--orbit-accent)] opacity-90" : "text-[var(--orbit-mute)]"
                            }`}
                          >
                            {sec.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--orbit-edge)] px-2">
                  <Link
                    to="/app"
                    className="liquid-btn w-full justify-center text-xs py-2.5 font-bold"
                  >
                    Launch Orbit App →
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Content Area — Detailed Topic Viewer */}
            <main className="lg:col-span-8 xl:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTopicId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Topic Breadcrumb & Header */}
                  <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] relative overflow-hidden">
                    <div className="flex items-center gap-2 font-mono text-xs text-[var(--orbit-accent)] mb-3">
                      <span>Docs</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--orbit-mute)]" />
                      <span className="text-white font-bold">{activeTopic.title}</span>
                      <span className="ml-auto rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-2.5 py-0.5 text-[10px]">
                        {activeTopic.badge}
                      </span>
                    </div>

                    <h2 className="font-display text-3xl font-bold text-white mb-3">{activeTopic.title}</h2>
                    <p className="text-sm text-[var(--orbit-mute)] leading-relaxed max-w-3xl">
                      {activeTopic.description}
                    </p>
                  </div>

                  {/* ────────────────── SECTION 1: PROTOCOL OVERVIEW ────────────────── */}
                  {activeTopicId === "overview" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <BookOpen className="h-5 w-5 text-[var(--orbit-accent)]" /> 1. Mission & Vision
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Orbit Protocol is an institutional-grade decentralized yield & structured finance protocol built natively on Stellar using Soroban WebAssembly (WASM) smart contracts. Orbit unlocks capital efficiency on Stellar by transforming basic deposits into high-yield, risk-tranched structured financial instruments and peer-to-peer liquidity markets.
                        </p>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/10 text-[var(--orbit-accent)] mb-3">
                              <Coins className="h-4 w-4" />
                            </div>
                            <div className="font-display text-base font-bold text-white mb-1.5">SEP-41 Yield Vaults</div>
                            <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                              Accepts native XLM deposits, mints liquid <code className="text-white">oXLM</code> share tokens, and routes idle liquidity to Blend Protocol money markets for sustainable APY.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--orbit-ok)]/10 text-[var(--orbit-ok)] mb-3">
                              <ArrowRightLeft className="h-4 w-4" />
                            </div>
                            <div className="font-display text-base font-bold text-white mb-1.5">Dual-Token Tranching</div>
                            <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                              Strips yield-bearing shares into Principal Tokens (<code className="text-white">PT</code>) for 100% nominal capital preservation and Yield Tokens (<code className="text-white">YT</code>) for high-beta APY trading.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--orbit-warn)]/10 text-[var(--orbit-warn)] mb-3">
                              <DollarSign className="h-4 w-4" />
                            </div>
                            <div className="font-display text-base font-bold text-white mb-1.5">P2P Escrow Market</div>
                            <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                              Trustless peer-to-peer USDC loans with PT/YT collateral locking, deterministic ledger expirations, and zero reliance on off-chain liquidation bots.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-4">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Activity className="h-5 w-5 text-[var(--orbit-accent)]" /> Protocol Architecture Flow
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Orbit executes within a deterministic, 4-tier smart contract pipeline:
                        </p>

                        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/60 p-6 font-mono text-xs text-[var(--orbit-mute)] leading-relaxed overflow-x-auto">
                          <div className="text-[var(--orbit-accent)] font-bold mb-3">// ORBIT PROTOCOL SMART CONTRACT ECOSYSTEM</div>
                          <div className="text-white">
                            {"[ User Wallet ]"} ──▶ {"Deposit XLM"} ──▶ {"[ orbit-vault ]"} ──▶ {"Mints oXLM Shares"}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──▶ {"Blend Protocol Lending Market (Organic Yield)"}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br />
                            {"[ orbit-tranche ]"} ◀── {"Wrap oXLM Shares"} ──▶ {"Mints PT (Base Value) + YT (Yield Right)"}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br />
                            {"[ orbit-market ]"} ◀── {"Lock PT/YT Collateral"} ──▶ {"Borrow Fixed-Term USDC Liquidity"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────── SECTION 2: SMART VAULT MECHANICS ────────────────── */}
                  {activeTopicId === "vaults" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Layers className="h-5 w-5 text-[var(--orbit-accent)]" /> 2.1 Net Asset Value (NAV) & Share Token Math
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          The Orbit Vault (<code className="text-white">orbit-vault</code>) implements the SEP-41 token standard for liquid share tokens (<code className="text-[var(--orbit-accent)]">oXLM</code>). When depositors provide XLM, share tokens are minted proportionally to the vault’s current Net Asset Value (NAV).
                        </p>

                        <div className="rounded-2xl border border-[var(--orbit-accent)]/30 bg-black/60 p-6 space-y-4 font-mono text-xs">
                          <div className="text-[var(--orbit-accent)] font-bold">// Monotonic Share Price Formula (Scaled by 1e7 stroops)</div>
                          <div className="text-white bg-white/[0.04] p-3 rounded-xl">
                            SharePrice = (TotalAssets * 10,000,000) / TotalShares
                          </div>
                          
                          <div className="text-[var(--orbit-mute)]">// Shares Minted on Deposit:</div>
                          <div className="text-white bg-white/[0.04] p-3 rounded-xl">
                            SharesMinted = TotalShares == 0 ? DepositAmount : (DepositAmount * TotalShares) / TotalAssets
                          </div>

                          <div className="text-[var(--orbit-mute)]">// Assets Returned on Withdrawal:</div>
                          <div className="text-white bg-white/[0.04] p-3 rounded-xl">
                            AssetsWithdrawn = (SharesBurned * TotalAssets) / TotalShares
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-4">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Coins className="h-5 w-5 text-[var(--orbit-accent)]" /> 2.2 Compounding Yield Strategy & Fee Allocation
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Orbit deploys idle assets into Blend Protocol lending pools. When interest is harvested:
                        </p>

                        <ul className="space-y-3 text-xs text-[var(--orbit-mute)]">
                          <li className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 text-[var(--orbit-ok)] shrink-0 mt-0.5" />
                            <span><strong>Performance Fee Deduction</strong>: A configurable performance fee (e.g. 10% / 1000 bps) is deducted from harvested yield and sent to the governance fee recipient.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 text-[var(--orbit-ok)] shrink-0 mt-0.5" />
                            <span><strong>Instant Share Appreciation</strong>: The remaining 90% is added to <code className="text-white">total_assets</code> without minting new shares, instantly increasing the NAV per share for all existing depositors.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 text-[var(--orbit-ok)] shrink-0 mt-0.5" />
                            <span><strong>Automated Keeper Bot</strong>: An automated service invokes <code className="text-white">harvest()</code> and records chronological <code className="text-white">PriceSnapshot</code> entries.</span>
                          </li>
                        </ul>

                        <CodeBlock
                          language="Rust (contracts/orbit-vault/src/lib.rs)"
                          code={`#[contractimpl]
impl OrbitVault {
    pub fn deposit(env: Env, from: Address, amount: i128, referrer: Option<Address>) -> i128 {
        from.require_auth();
        assert!(amount > 0, "deposit amount must be positive");

        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap();
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap();
        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();

        // Transfer XLM from user to vault
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        TokenClient::new(&env, &asset).transfer(&from, &env.current_contract_address(), &amount);

        // Compute shares to mint
        let shares_to_mint = if total_shares == 0 || total_assets == 0 {
            amount
        } else {
            (amount * total_shares) / total_assets
        };

        // Mint SEP-41 share tokens
        ShareTokenClient::new(&env, &share_token).mint(&env.current_contract_address(), &from, shares_to_mint);

        // Update vault state
        env.storage().instance().set(&DataKey::TotalAssets, &(total_assets + amount));
        env.storage().instance().set(&DataKey::TotalShares, &(total_shares + shares_to_mint));

        shares_to_mint
    }
}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* ────────────────── SECTION 3: YIELD TRANCHING ────────────────── */}
                  {activeTopicId === "tranching" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <ArrowRightLeft className="h-5 w-5 text-[var(--orbit-accent)]" /> 3.1 Principal Tokens (PT) & Yield Tokens (YT)
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Yield Tranching (<code className="text-white">orbit-tranche</code>) allows depositors to unbundle a variable-yield vault position into two specialized tokens catering to different risk appetites:
                        </p>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--orbit-accent)]/30 bg-black/40 p-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-display text-lg font-bold text-[var(--orbit-accent)]">Principal Token (PT)</span>
                              <span className="rounded-full bg-[var(--orbit-accent)]/15 px-2.5 py-0.5 font-mono text-[10px] text-[var(--orbit-accent)]">Capital Guard</span>
                            </div>
                            <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                              Represents direct ownership of the exact nominal XLM value deposited at wrap time. PT holders can redeem their tokens for the exact principal amount at any time, eliminating exposure to yield fluctuations.
                            </p>
                            <div className="rounded-xl bg-white/[0.03] p-3 font-mono text-[11px] text-white">
                              PT Value = Base Nominal XLM (Guaranteed Par Value)
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[var(--orbit-ok)]/30 bg-black/40 p-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-display text-lg font-bold text-[var(--orbit-ok)]">Yield Token (YT)</span>
                              <span className="rounded-full bg-[var(--orbit-ok)]/15 px-2.5 py-0.5 font-mono text-[10px] text-[var(--orbit-ok)]">High-Beta APY</span>
                            </div>
                            <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                              Represents rights to 100% of all accrued variable yield generated by the vault above the base principal. YT holders capture amplified yield without risking the underlying base capital.
                            </p>
                            <div className="rounded-xl bg-white/[0.03] p-3 font-mono text-[11px] text-white">
                              YT Value = (Current Share NAV) - (Base Nominal Value)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-4">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Lock className="h-5 w-5 text-[var(--orbit-accent)]" /> 3.2 Two-Phase Allowance Wrapping Flow
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          To wrap <code className="text-white">oXLM</code> shares into PT and YT, Orbit uses the standard Soroban allowance pattern:
                        </p>

                        <CodeBlock
                          language="Rust (contracts/orbit-tranche/src/lib.rs)"
                          code={`#[contractimpl]
impl OrbitTranche {
    /// Mint 1 PT and 1 YT for each oXLM share deposited.
    pub fn mint(env: Env, from: Address, share_amount: i128) {
        from.require_auth();
        assert!(share_amount > 0, "amount must be positive");

        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();
        let pt_token: Address = env.storage().instance().get(&DataKey::PtToken).unwrap();
        let yt_token: Address = env.storage().instance().get(&DataKey::YtToken).unwrap();

        // 1. Pull shares from user to tranche contract via transfer_from
        TokenClient::new(&env, &share_token).transfer_from(
            &env.current_contract_address(),
            &from,
            &env.current_contract_address(),
            &share_amount,
        );

        // 2. Mint PT and YT tokens to the user
        TokenClient::new(&env, &pt_token).mint(&env.current_contract_address(), &from, share_amount);
        TokenClient::new(&env, &yt_token).mint(&env.current_contract_address(), &from, share_amount);
    }
}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* ────────────────── SECTION 4: P2P MONEY MARKET ────────────────── */}
                  {activeTopicId === "market" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <DollarSign className="h-5 w-5 text-[var(--orbit-accent)]" /> 4.1 Fixed-Term Collateralized Lending
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          The Orbit Peer-to-Peer Money Market (<code className="text-white">orbit-market</code>) enables trustless borrowing and lending on Stellar. Lenders deposit USDC liquidity into on-chain escrow offers, and borrowers lock their Orbit PT or YT tokens as collateral.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 space-y-2">
                            <div className="font-display text-base font-bold text-white">Zero Liquidation Bots Required</div>
                            <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                              Unlike traditional variable-rate overcollateralized pools (e.g. Aave/Compound) that require high-frequency MEV liquidation bots, Orbit uses fixed-ledger duration escrow logic. If a borrower fails to repay before the expiration ledger, the lender automatically claims the escrowed PT/YT collateral directly in WASM.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 space-y-2">
                            <div className="font-display text-base font-bold text-white">Collateral Capital Efficiency</div>
                            <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                              Because Principal Tokens (PT) have a fixed nominal redemption floor, lenders can safely offer high Loan-to-Value (LTV) ratios (up to 85%) without fearing flash crash liquidations.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-4">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Code className="h-5 w-5 text-[var(--orbit-accent)]" /> 4.2 Loan Lifecycle Contract Code
                        </h3>

                        <CodeBlock
                          language="Rust (contracts/orbit-market/src/lib.rs)"
                          code={`#[contractimpl]
impl OrbitMarket {
    /// Lender creates an offer to lend USDC for fixed interest
    pub fn create_offer(
        env: Env,
        lender: Address,
        usdc_amount: i128,
        interest_amount: i128,
        max_duration_ledgers: u32,
        required_collateral_token: Address,
        required_collateral_amount: i128,
    ) -> u32 {
        lender.require_auth();
        assert!(usdc_amount > 0, "amount must be positive");

        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        TokenClient::new(&env, &usdc_token).transfer(&lender, &env.current_contract_address(), &usdc_amount);

        let mut count: u32 = env.storage().instance().get(&DataKey::OfferCount).unwrap();
        count += 1;

        let offer = LoanOffer {
            lender,
            usdc_amount,
            interest_amount,
            max_duration_ledgers,
            required_collateral_token,
            required_collateral_amount,
            is_active: true,
        };

        env.storage().instance().set(&DataKey::Offer(count), &offer);
        env.storage().instance().set(&DataKey::OfferCount, &count);
        count
    }
}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* ────────────────── SECTION 5: ZAP ROUTER & POINTS ────────────────── */}
                  {activeTopicId === "zap-points" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Zap className="h-5 w-5 text-[var(--orbit-accent)]" /> 5.1 Cross-Asset Zap Router (`orbit-zap-router`)
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          The Zap Router contract allows users to deposit any supported token (e.g. USDC or Index tokens) into the Orbit XLM Vault in a single atomic transaction without manual DEX swapping steps.
                        </p>

                        <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5 space-y-3 text-xs text-[var(--orbit-mute)]">
                          <div className="font-display text-sm font-bold text-white">Atomic Swap & Deposit Flow:</div>
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20 font-mono text-[10px] text-[var(--orbit-accent)]">1</span>
                              <span>User approves Zap Router contract on input token (<code className="text-white">Token::approve</code>).</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20 font-mono text-[10px] text-[var(--orbit-accent)]">2</span>
                              <span>Zap Router pulls tokens via <code className="text-white">transfer_from</code> and executes the swap.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--orbit-accent)]/20 font-mono text-[10px] text-[var(--orbit-accent)]">3</span>
                              <span>Zap Router calls <code className="text-white">OrbitVault::deposit()</code>, minting <code className="text-white">oXLM</code> shares directly to user.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-4">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Award className="h-5 w-5 text-[var(--orbit-accent)]" /> 5.2 Gamified Orbit Points & Referral Tiers
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Orbit tracks points on every deposit and referral. Points determine global leaderboard standing and tier multipliers:
                        </p>

                        <div className="grid gap-4 md:grid-cols-4 font-mono text-xs">
                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 text-center">
                            <div className="text-[var(--orbit-mute)] text-[10px] uppercase">Base Deposit</div>
                            <div className="text-lg font-bold text-white mt-1">10 Pts / XLM</div>
                            <div className="text-[9px] text-[var(--orbit-mute)] mt-1">Awarded on confirmation</div>
                          </div>
                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 text-center">
                            <div className="text-[var(--orbit-mute)] text-[10px] uppercase">Direct Referral</div>
                            <div className="text-lg font-bold text-[var(--orbit-accent)] mt-1">+10% Boost</div>
                            <div className="text-[9px] text-[var(--orbit-mute)] mt-1">Bonus on invitee volume</div>
                          </div>
                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 text-center">
                            <div className="text-[var(--orbit-mute)] text-[10px] uppercase">Tranche Wrap</div>
                            <div className="text-lg font-bold text-[var(--orbit-ok)] mt-1">25 Pts / Share</div>
                            <div className="text-[9px] text-[var(--orbit-mute)] mt-1">Structured finance bonus</div>
                          </div>
                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 text-center">
                            <div className="text-[var(--orbit-mute)] text-[10px] uppercase">P2P Lending</div>
                            <div className="text-lg font-bold text-[var(--orbit-warn)] mt-1">50 Pts / Offer</div>
                            <div className="text-[9px] text-[var(--orbit-mute)] mt-1">Liquidity provision reward</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────── SECTION 6: SECURITY & AUTH ────────────────── */}
                  {activeTopicId === "security" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <ShieldCheck className="h-5 w-5 text-[var(--orbit-accent)]" /> 6.1 Cryptographic Auth & Security Architecture
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Orbit enforces end-to-end cryptographic authorization at both the smart contract layer and off-chain data services.
                        </p>

                        <div className="space-y-4 text-xs text-[var(--orbit-mute)]">
                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                            <div className="font-display text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                              <KeyRound className="h-4 w-4 text-[var(--orbit-accent)]" /> Soroban Address.require_auth()
                            </div>
                            <p className="leading-relaxed">
                              Every mutating entry point in Orbit Rust contracts requires explicit cryptographic signatures from caller addresses. Non-authorized callers cannot initiate deposits, redemptions, or loan acceptances.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                            <div className="font-display text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                              <Activity className="h-4 w-4 text-[var(--orbit-ok)]" /> SEP-40 Decentralized Price Oracle
                            </div>
                            <p className="leading-relaxed">
                              Asset pricing, TVL valuation, and portfolio USD balances are referenced from live SEP-40 decentralized price feeds on Stellar Testnet, with automated caching and fallback resilience.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                            <div className="font-display text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                              <Server className="h-4 w-4 text-[var(--orbit-warn)]" /> Strict Supabase User & Tx Isolation
                            </div>
                            <p className="leading-relaxed">
                              To prevent cross-user transaction collisions, Supabase records use a deterministic composite primary key: <code className="text-white">id = "$&#123;wallet_address&#125;_$&#123;tx_hash&#125;_$&#123;type&#125;"</code> with foreign key integrity. User queries always execute under isolated address filters with Set-based deduplication.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────── SECTION 7: DEPLOYED CONTRACTS ────────────────── */}
                  {activeTopicId === "contracts" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Code className="h-5 w-5 text-[var(--orbit-accent)]" /> 7.1 Deployed Smart Contract Registry (Testnet)
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          All contracts are actively deployed and verified on Stellar Testnet. You can verify transactions, inspect WASM bytecode, and view events on Stellar Expert.
                        </p>

                        <div className="space-y-3">
                          {CONTRACTS.map((c) => (
                            <div
                              key={c.id}
                              className="flex flex-col gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4.5 sm:flex-row sm:items-center sm:justify-between hover:border-[var(--orbit-accent)]/30 transition-all"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-sm font-bold text-white">{c.name}</span>
                                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[9px] text-[var(--orbit-mute)]">
                                    {c.category}
                                  </span>
                                </div>
                                <div className="font-mono text-[10px] text-[var(--orbit-mute)] mt-0.5">{c.role}</div>
                                <div className="mt-1.5 font-mono text-xs text-[var(--orbit-accent)] break-all">{c.id}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => copyAddress(c.id)}
                                  className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] px-3 py-2 font-mono text-xs text-[var(--orbit-mute)] hover:text-white transition-colors"
                                >
                                  {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-[var(--orbit-ok)]" /> : <Copy className="h-3.5 w-3.5" />}
                                  {copiedId === c.id ? "Copied" : "Copy ID"}
                                </button>
                                <a
                                  href={`https://stellar.expert/explorer/testnet/contract/${c.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 rounded-xl border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-3 py-2 font-mono text-xs text-[var(--orbit-accent)] hover:bg-[var(--orbit-accent)]/20 transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> Explorer
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────── SECTION 8: DEVELOPER & SDK GUIDE ────────────────── */}
                  {activeTopicId === "devguide" && (
                    <div className="space-y-8">
                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Terminal className="h-5 w-5 text-[var(--orbit-accent)]" /> 8.1 Building & Compiling Soroban Contracts
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Orbit smart contracts are written in Rust targeting the <code className="text-white">wasm32v1-none</code> WebAssembly target.
                        </p>

                        <CodeBlock
                          language="Bash / Terminal"
                          code={`# 1. Install Rust WASM target
rustup target add wasm32v1-none

# 2. Build all contracts in workspace
stellar contract build --package orbit-vault
stellar contract build --package orbit-tranche
stellar contract build --package orbit-market

# 3. Deploy to Stellar Testnet
stellar contract deploy \\
  --wasm target/wasm32v1-none/release/orbit_vault.wasm \\
  --source-account orbit-deployer \\
  --network testnet`}
                        />
                      </div>

                      <div className="glass rounded-3xl p-8 border border-[var(--orbit-edge)] space-y-6">
                        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
                          <Code className="h-5 w-5 text-[var(--orbit-accent)]" /> 8.2 Client SDK TypeScript Integration
                        </h3>
                        <p className="text-sm text-[var(--orbit-mute)] leading-relaxed">
                          Invoke Orbit contracts directly from frontend or backend applications using <code className="text-white">@stellar/stellar-sdk</code>:
                        </p>

                        <CodeBlock
                          language="TypeScript"
                          code={`import { readContract, invokeContract } from "@/lib/stellar/soroban";
import { ORBIT_VAULT_CONTRACT_ID } from "@/lib/stellar/network";
import * as StellarSdk from "@stellar/stellar-sdk";

// 1. Read Vault Total Assets (Simulated Read-Only Call)
export async function fetchVaultTotalAssets() {
  const result = await readContract(ORBIT_VAULT_CONTRACT_ID, "total_assets", []);
  return StellarSdk.scValToBigInt(result);
}

// 2. Execute Deposit Transaction (Mutating Call with Nonce & Auth)
export async function executeDeposit(signerKey: string, amountStroops: bigint) {
  const amountScVal = StellarSdk.nativeToScVal(amountStroops, { type: "i128" });
  return await invokeContract(ORBIT_VAULT_CONTRACT_ID, "deposit", [
    StellarSdk.Address.fromString(signerKey).toScVal(),
    amountScVal,
  ]);
}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Previous / Next Chapter Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-[var(--orbit-edge)]">
                    {prevTopic ? (
                      <button
                        onClick={() => {
                          setActiveTopicId(prevTopic.id);
                          window.scrollTo({ top: 180, behavior: "smooth" });
                        }}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.02] px-5 py-3.5 text-left hover:border-[var(--orbit-accent)]/40 hover:bg-white/[0.04] transition-all"
                      >
                        <ChevronLeft className="h-4 w-4 text-[var(--orbit-accent)]" />
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Previous Topic</div>
                          <div className="font-display text-sm font-bold text-white">{prevTopic.title}</div>
                        </div>
                      </button>
                    ) : (
                      <div />
                    )}

                    {nextTopic && (
                      <button
                        onClick={() => {
                          setActiveTopicId(nextTopic.id);
                          window.scrollTo({ top: 180, behavior: "smooth" });
                        }}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--orbit-edge)] bg-white/[0.02] px-5 py-3.5 text-right hover:border-[var(--orbit-accent)]/40 hover:bg-white/[0.04] transition-all"
                      >
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--orbit-mute)]">Next Topic</div>
                          <div className="font-display text-sm font-bold text-white">{nextTopic.title}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--orbit-accent)]" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

