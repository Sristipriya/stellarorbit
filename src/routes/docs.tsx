import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/orbit/TopNav";
import { ShaderBackground } from "@/components/ui/animated-shader-hero";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  BookOpen, ShieldCheck, Layers, ArrowRightLeft, DollarSign,
  Cpu, Copy, ExternalLink, Check, Code, Zap, FileText, Lock
} from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Orbit Protocol" },
      {
        name: "description",
        content: "Technical documentation, contract specifications, yield tranching architecture, and API guides for Orbit Protocol on Stellar Soroban.",
      },
    ],
  }),
  component: DocumentationPage,
});

const CONTRACTS = [
  { name: "Orbit XLM Vault", id: "CBLDIHKSHOXC3Q3R2YNCT54OPTX5QRALNYKK3UDNZ4KAQD7DEINJYV5P", role: "Core Yield Vault & NAV Accounting" },
  { name: "oXLM Share Token", id: "CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ", role: "SEP-41 Vault Share Token" },
  { name: "Orbit Tranche v2", id: "CBOCF47NMQAT7TS4X4CTS7D3MPAD4MIPMOBZPUE5EOM52WTAIOOVJDCU", role: "Yield Stripping (PT + YT Tokenization)" },
  { name: "PT Token (Principal)", id: "CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL", role: "Fixed Principal Redemption Token" },
  { name: "YT Token (Yield)", id: "CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR", role: "Floating Yield Claim Token" },
  { name: "P2P Money Market", id: "CBU7OPCENTV6XT33IYNBNYVC7YU2PNQD4X22TBAI4R72Q2QBVMERLGWT", role: "Trustless Collateralized Money Market" },
  { name: "Test USDC", id: "CBM6JPPGBESHXXPW6YKGSM2W6CVEL7KHQ6WDWXVDBSY2QWHD4K6R4N2I", role: "Settlement Currency Token" },
];

const SECTIONS = [
  { id: "overview", title: "Protocol Overview", icon: BookOpen },
  { id: "vaults", title: "Smart Vault Mechanics", icon: Layers },
  { id: "tranching", title: "Yield Tranching (PT & YT)", icon: ArrowRightLeft },
  { id: "market", title: "P2P Money Market", icon: DollarSign },
  { id: "auth", title: "Security & Auth Stack", icon: ShieldCheck },
  { id: "contracts", title: "Deployed Contracts", icon: Code },
];

function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

        {/* Documentation Header */}
        <header className="border-b border-[var(--orbit-edge)] bg-black/40 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-3 py-1 font-mono text-xs text-[var(--orbit-accent)] mb-4">
              <FileText className="h-3.5 w-3.5" /> Orbit Technical Documentation v2.0
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
              Orbit Protocol Docs
            </h1>
            <p className="mt-3 max-w-3xl text-base text-[var(--orbit-mute)]">
              Comprehensive architectural guide to Orbit’s Soroban smart contracts, SEP-41 share tokens, yield tranching mechanisms, and P2P lending money markets on Stellar.
            </p>
          </div>
        </header>

        {/* Main Documentation Container */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <div className="sticky top-24 space-y-1 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-3 backdrop-blur-xl">
                <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[var(--orbit-mute)]">
                  Documentation Topics
                </div>
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-[var(--orbit-accent)]/15 text-[var(--orbit-accent)] border border-[var(--orbit-accent)]/30"
                          : "text-[var(--orbit-mute)] hover:bg-white/[0.03] hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {sec.title}
                    </button>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-[var(--orbit-edge)] px-3">
                  <Link
                    to="/app"
                    className="liquid-btn w-full justify-center text-xs py-2.5 font-bold"
                  >
                    Launch App →
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Content Body */}
            <main className="lg:col-span-9 space-y-12">
              {/* Section 1: Overview */}
              <section id="overview" className="glass rounded-3xl p-8 border border-[var(--orbit-edge)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/20">
                    <BookOpen className="h-5 w-5 text-[var(--orbit-accent)]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">1. Protocol Overview</h2>
                </div>
                <p className="text-sm text-[var(--orbit-mute)] leading-relaxed mb-6">
                  Orbit Protocol is an institutional-grade decentralized yield & asset management suite built natively on Stellar using Soroban WASM smart contracts. It unifies high-efficiency yield aggregation with advanced structured finance primitives (Yield Tranching & Peer-to-Peer Money Markets).
                </p>
                
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/30 p-5">
                    <div className="font-display text-base font-bold text-white mb-2">Real Yield Generation</div>
                    <p className="text-xs text-[var(--orbit-mute)]">Deploys vault capital into Blend Protocol lending markets via cross-contract calls, returning organic, non-inflationary APY.</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/30 p-5">
                    <div className="font-display text-base font-bold text-white mb-2">Yield Stripping</div>
                    <p className="text-xs text-[var(--orbit-mute)]">Splits vault share tokens into Principal Tokens (PT) for capital preservation and Yield Tokens (YT) for yield trading.</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/30 p-5">
                    <div className="font-display text-base font-bold text-white mb-2">P2P Escrow Market</div>
                    <p className="text-xs text-[var(--orbit-mute)]">Enables fixed-term USDC loans backed by PT/YT collateral without reliance on centralized liquidation bots.</p>
                  </div>
                </div>
              </section>

              {/* Section 2: Smart Vault Mechanics */}
              <section id="vaults" className="glass rounded-3xl p-8 border border-[var(--orbit-edge)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/20">
                    <Layers className="h-5 w-5 text-[var(--orbit-accent)]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">2. Smart Vault Mechanics (`orbit-vault`)</h2>
                </div>
                
                <p className="text-sm text-[var(--orbit-mute)] leading-relaxed mb-4">
                  The Orbit XLM Vault accepts native XLM deposits and issues SEP-41 compliant share tokens (<code className="text-[var(--orbit-accent)]">oXLM</code>). Net Asset Value (NAV) per share increases monotonically as yield is harvested.
                </p>

                <div className="rounded-2xl border border-[var(--orbit-accent)]/20 bg-black/50 p-6 font-mono text-xs space-y-3 mb-6">
                  <div className="text-[var(--orbit-accent)] font-bold">// Net Asset Value (NAV) Formula</div>
                  <div className="text-white">Share Price (scaled 1e7) = (TotalAssets * 10,000,000) / TotalShares</div>
                  <div className="text-[var(--orbit-mute)]">// Shares minted on deposit:</div>
                  <div className="text-white">SharesMinted = (DepositAmount * TotalShares) / TotalAssets</div>
                </div>

                <div className="space-y-3 text-xs text-[var(--orbit-mute)]">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[var(--orbit-ok)] shrink-0 mt-0.5" />
                    <span><strong>SEP-41 Compliance</strong>: Full token interface implementation (<code className="text-white">transfer</code>, <code className="text-white">transfer_from</code>, <code className="text-white">approve</code>, <code className="text-white">mint</code>, <code className="text-white">burn</code>).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[var(--orbit-ok)] shrink-0 mt-0.5" />
                    <span><strong>Access Control</strong>: Minter authorization is locked exclusively to the Vault contract address via <code className="text-white">assert_minter</code>.</span>
                  </div>
                </div>
              </section>

              {/* Section 3: Yield Tranching */}
              <section id="tranching" className="glass rounded-3xl p-8 border border-[var(--orbit-edge)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/20">
                    <ArrowRightLeft className="h-5 w-5 text-[var(--orbit-accent)]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">3. Yield Tranching Super-Protocol (`orbit-tranche`)</h2>
                </div>

                <p className="text-sm text-[var(--orbit-mute)] leading-relaxed mb-6">
                  Yield Tranching decouples an yield-bearing asset into two distinct risk/reward tokens:
                </p>

                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6">
                    <div className="font-display text-lg font-bold text-[var(--orbit-accent)] mb-2">Principal Token (PT)</div>
                    <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                      Represents ownership of the initial nominal XLM value deposited. PT holders can redeem their tokens for the exact base capital value at any point with zero exposure to variable yield fluctuations.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-6">
                    <div className="font-display text-lg font-bold text-[var(--orbit-ok)] mb-2">Yield Token (YT)</div>
                    <p className="text-xs text-[var(--orbit-mute)] leading-relaxed">
                      Represents claim rights to 100% of all floating yield generated by the vault above the base principal value. YT holders collect variable APY harvested from Blend lending pools.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4: P2P Money Market */}
              <section id="market" className="glass rounded-3xl p-8 border border-[var(--orbit-edge)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/20">
                    <DollarSign className="h-5 w-5 text-[var(--orbit-accent)]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">4. Peer-to-Peer Money Market (`orbit-market`)</h2>
                </div>

                <p className="text-sm text-[var(--orbit-mute)] leading-relaxed mb-6">
                  The P2P Money Market is a trustless, fixed-term lending engine. Lenders escrow test USDC liquidity, specifying fixed duration ledgers and interest rates. Borrowers lock Orbit PT or YT tokens as collateral to draw liquidity instantly.
                </p>
              </section>

              {/* Section 5: Security & Auth */}
              <section id="auth" className="glass rounded-3xl p-8 border border-[var(--orbit-edge)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/20">
                    <ShieldCheck className="h-5 w-5 text-[var(--orbit-accent)]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">5. Security & Authentication Architecture</h2>
                </div>

                <div className="space-y-4 text-xs text-[var(--orbit-mute)]">
                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                    <div className="font-display text-sm font-semibold text-white mb-1">On-Chain Cryptographic Authorization</div>
                    <p>All mutating Soroban smart contract calls enforce native <code className="text-[var(--orbit-accent)]">Address.require_auth()</code>. Users sign transaction XDRs using non-custodial Stellar wallet modules.</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                    <div className="font-display text-sm font-semibold text-white mb-1">Sign-In With Stellar (SIWS) Authentication</div>
                    <p>Off-chain user onboarding & display profile management utilizes cryptographic message signing with ed25519 public key validation.</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-5">
                    <div className="font-display text-sm font-semibold text-white mb-1">Web Crypto Admin Hashing</div>
                    <p>Admin security uses browser Web Crypto API SHA-256 salted digest hashing with session expiration timestamps.</p>
                  </div>
                </div>
              </section>

              {/* Section 6: Deployed Smart Contracts */}
              <section id="contracts" className="glass rounded-3xl p-8 border border-[var(--orbit-edge)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--orbit-accent)]/20">
                    <Code className="h-5 w-5 text-[var(--orbit-accent)]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">6. Deployed Smart Contract Registry</h2>
                </div>

                <div className="space-y-3">
                  {CONTRACTS.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col gap-2 rounded-2xl border border-[var(--orbit-edge)] bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-display text-sm font-bold text-white">{c.name}</div>
                        <div className="font-mono text-[10px] text-[var(--orbit-mute)]">{c.role}</div>
                        <div className="mt-1 font-mono text-[11px] text-[var(--orbit-accent)]">{c.id}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => copyAddress(c.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--orbit-edge)] bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-[var(--orbit-mute)] hover:text-white transition-colors"
                        >
                          {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-[var(--orbit-ok)]" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === c.id ? "Copied" : "Copy"}
                        </button>
                        <a
                          href={`https://stellar.expert/explorer/testnet/contract/${c.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--orbit-accent)]/30 bg-[var(--orbit-accent)]/10 px-3 py-1.5 font-mono text-xs text-[var(--orbit-accent)] hover:bg-[var(--orbit-accent)]/20 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Explorer
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
