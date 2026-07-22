# Orbit — Multi-Asset RWA Index Vault on Stellar Testnet

> _Index vault for on-chain assets on Stellar. Soroban-powered, multi-wallet, fully production-ready._

[![Live Demo](https://img.shields.io/badge/Live%20Demo-stellarorbit.vercel.app-8af)](https://stellarorbit.vercel.app/)
[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-blue)](https://stellar.org)
[![Contract](https://img.shields.io/badge/Soroban-Testnet%20Contract-purple)](https://stellar.expert/explorer/testnet/contract/CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN)

Orbit is a **Soroban-powered single-asset index vault** deployed on **Stellar Testnet**, architected to grow into a multi-asset RWA index using SEP-40 oracles. Connect a Stellar wallet, fund via Friendbot, deposit XLM into the vault contract, receive shares, and withdraw at current share NAV.

---

## Live Deployment

| Resource             | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| **Live Demo**        | https://stellarorbit.vercel.app/                           |
| **Contract Address** | `CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN` |
| **Network**          | Stellar Testnet                                            |
| **Soroban RPC**      | `https://soroban-testnet.stellar.org`                      |

---

## Features

### User-Facing

- **Multi-Wallet Support** — Connect via StellarWalletsKit with a premium glassmorphic, animated modal.
- **Mandatory Onboarding & Auth Flow** — Zero-friction onboarding syncs wallets and display names to a Supabase backend to personalize the global leaderboard.
- **Real Yield via Blend Protocol** — Vaults utilize Blend Protocol lending markets for real cross-contract yield.
- **Zap Deposits** — Deposit any Stellar asset; the frontend automatically routes through Soroswap before depositing native assets into the vault.
- **Fiat On-Ramp (SEP-24)** — Built-in modal to buy crypto with fiat via testanchor.stellar.org.
- **Progressive Web App (PWA)** — Installable on mobile/desktop, works offline, and supports background sync.
- **Vault Strategies Marketplace** — UI allowing third-party strategists to submit new vault strategies and parameter tuning for the DAO.
- **Yield Projection** — A chart projecting compound growth using Blend APY against a standard wallet hold.
- **SEP-41 Compliant Share Token** — Users receive a minted `share_token` representing their proportional share.
- **Live Soroban Event Polling** — Real-time ledger polling instantly updates TVL, Volume, Analytics charts, and Leaderboards without a backend indexer.
- **Deposit & Withdraw** — Soroban contract calls with wallet signing; preview shares before submitting.
- **Share Certificate** — Visual ownership card with copy-to-clipboard and USD equivalent value.
- **SEP-40 Oracle Panel** — Live XLM/USD price feed converts TVL and share price into USD.
- **Vault Simulator** — What-if calculator: project returns over time with an interactive chart.
- **Leaderboard** — Ranked depositor table derived directly from on-chain Soroban events.
- **Transaction History** — Full deposit/withdrawal history with explorer links.
- **Network Status Bar** — Live Soroban RPC latency, color-coded dot, and latest ledger number.
- **Testnet Faucet** — One-click Friendbot funding for new accounts.

### DeFi Super-Protocol Features

- **Yield Tranching (`orbit-tranche`)** — Wrap your Orbit shares to split them into Principal Tokens (PT) and Yield Tokens (YT). This strips the yield into a separate tradable asset while perfectly protecting your original principal value!
- **P2P Collateralized Lending (`orbit-market`)** — A fully trustless peer-to-peer money market. Lenders escrow USDC for a fixed duration/interest, and borrowers lock their Orbit PT or YT tokens as collateral to take the loan instantly. No liquidation bots or price oracles required!

---

## Architecture

```text
 ┌────────────────┐   sign tx (XDR)    ┌──────────────────────────────────┐
 │ Stellar wallet │ ◀───────────────── │  Orbit web app (TanStack Start)  │
 │ (Freighter,    │ ─signed XDR──────▶ │  / landing · /app dashboard      │
 │  Albedo, xBull,│                    └──────────┬───────────────────────┘
 │  Lobstr)       │                               │ Horizon / Soroban RPC
 └────────────────┘                               ▼
                                       ┌──────────────────────┐
                                       │  Soroban contract    │
                                       │  orbit-vault         │
                                       │  deposit / withdraw  │
                                       │  balance_of / price  │
                                       └──────────┬───────────┘
                                                  ▼
                                       ┌──────────────────────┐
                                       │  L4+ : SEP-40 oracles│
                                       │  multi-asset RWA NAV │
                                       └──────────────────────┘
```

---

## Project Structure

```
stellarorbit/
├── contracts/
│   └── orbit-vault/           Rust Soroban contract + tests
│       ├── src/lib.rs         deposit · withdraw · share math
│       ├── Cargo.toml
│       └── README.md
│
├── scripts/
│   ├── setup.sh               Full setup (install deps + deploy contract)
│   └── deploy-vault.sh        Deploy/redeploy contract to Testnet
│
├── docs/
│   └── screenshots/           UI screenshots for README
│
├── src/
│   ├── routes/
│   │   ├── __root.tsx         Root layout, Toaster, NotificationProvider
│   │   ├── index.tsx          Landing page (Hero, Stats, HowItWorks, FAQ, Roadmap)
│   │   └── app.tsx            Vault dashboard route
│   │
│   ├── components/
│   │   ├── orbit/
│   │   │   ├── AppDashboard.tsx     Main dashboard shell (sidebar, tabs, mobile nav)
│   │   │   ├── DepositCard.tsx      XLM → shares deposit form
│   │   │   ├── WithdrawCard.tsx     Shares → XLM withdraw form
│   │   │   ├── ActivityFeed.tsx     Recent on-chain events feed
│   │   │   ├── FundBanner.tsx       Friendbot fund prompt
│   │   │   ├── ShareCertificate.tsx Visual ownership certificate card
│   │   │   ├── OraclePricePanel.tsx SEP-40 oracle XLM/USD panel
│   │   │   ├── SimulatorTab.tsx     What-if return calculator with chart
│   │   │   ├── LeaderboardTab.tsx   Depositor leaderboard from on-chain events
│   │   │   ├── NetworkStatusBar.tsx Live RPC latency + ledger indicator
│   │   │   ├── NotificationCenter.tsx Bell + dropdown notification panel
│   │   │   ├── MobileBottomNav.tsx  Fixed bottom nav for mobile
│   │   │   ├── SkeletonCards.tsx    Loading skeleton components
│   │   │   ├── TxStatus.tsx         Transaction status card
│   │   │   ├── NavPanel.tsx         (legacy)
│   │   │   ├── TopNav.tsx           Landing page top nav
│   │   │   ├── OrbitLogo.tsx
│   │   │   ├── OrbitMark.tsx
│   │   │   ├── PositionCard.tsx
│   │   │   ├── VaultOverview.tsx
│   │   │   └── WalletButton.tsx
│   │   └── ui/
│   │       └── ...                  shadcn/ui primitives
│   │
│   ├── hooks/
│   │   ├── use-vault.ts       Vault state polling (15s) + event polling (8s)
│   │   ├── use-wallet.ts      Wallet connect/disconnect, balance refresh
│   │   └── use-mobile.tsx     Mobile breakpoint hook
│   │
│   ├── lib/
│   │   ├── oracle-price.ts    XLM/USD price from Stellar Expert + CoinGecko fallback
│   │   ├── notifications.tsx  React context + useNotifications hook
│   │   ├── utils.ts
│   │   ├── error-capture.ts
│   │   └── stellar/
│   │       ├── network.ts     NETWORK config, stroops helpers, shortAddr
│   │       ├── vault.ts       Vault service (deposit, withdraw, getVaultState)
│   │       ├── events.ts      Activity event polling (Soroban RPC + Horizon)
│   │       ├── soroban.ts     Soroban RPC client (readContract, invokeContract)
│   │       ├── wallet.ts      StellarWalletsKit setup + signTx
│   │       ├── balance.ts     XLM balance fetch
│   │       ├── health.ts      Soroban RPC latency check
│   │       └── friendbot.ts   Friendbot funding
│   │
│   ├── styles.css             Design tokens, glass, liquid-btn, skeleton, bottom nav
│   ├── router.tsx             TanStack router setup
│   ├── routeTree.gen.ts       Auto-generated route tree (includes admin routes)
│   ├── server.ts              TanStack Start server entry
│   └── start.ts              App entry point
│
├── .env.example               Environment variable template
├── .env                       Local environment (gitignored)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Environment Variables

| Variable                       | Required | Default     | Description                                                |
| ------------------------------ | -------- | ----------- | ---------------------------------------------------------- |
| `VITE_ORBIT_VAULT_CONTRACT_ID` | No       | `""`        | Deployed Soroban contract ID. If unset, runs in demo mode. |

---

## Setup

### Prerequisites

- Node 20+ with `bun` (or `pnpm`)
- Rust + `wasm32-unknown-unknown` target
- `stellar-cli` (`cargo install --locked stellar-cli`) and `jq`
- A Stellar wallet extension (Freighter recommended)

### Quick Start

```bash
# Clone and install dependencies
git clone <repo-url>
cd stellarorbit
bun install

# Copy env template
cp .env.example .env

# (Optional) Deploy the Soroban vault contract to Testnet
scripts/setup.sh

# Start dev server
bun run dev   # http://localhost:8080
```

### Demo Mode (No Contract Deploy Required)

```bash
scripts/setup.sh --skip-deploy
bun run dev
```

In demo mode, deposits and withdrawals are real Testnet payments with memo tags. Share state is stored in `localStorage`.

### Redeploy Only the Contract

```bash
scripts/deploy-vault.sh              # uses identity "orbit-deployer"
scripts/deploy-vault.sh my-identity  # use a different stellar-cli identity
```

---

## Admin Panel

Access at `/admin/` (e.g. `http://localhost:8080/admin/`).

**Default credentials:** `admin` / `orbit2024`

Set `VITE_ADMIN_USER` and `VITE_ADMIN_PASS` in `.env` to change them before deploying.

The admin panel is read-only — it displays live analytics from the Stellar Testnet. No write operations are performed.

---

## Operating Modes

| Mode     | `VITE_ORBIT_VAULT_CONTRACT_ID` | Share state              | Activity                     |
| -------- | ------------------------------ | ------------------------ | ---------------------------- |
| **Real** | Set to deployed contract       | On-chain via Soroban RPC | Soroban contract events      |
| **Demo** | Not set                        | `localStorage`           | Horizon memo-tagged payments |

---

## Screenshots

Here are a few inline screenshots to give a quick feel for the app UI.

### Landing

![Landing](docs/screenshots/Landing.png)

Shows the landing page hero with the orbit animation and primary CTA.

### Deposit / Success

![Deposit Success](docs/screenshots/Deposit.png)

Deposit flow and success card — this includes the transaction hash shown on success.

### Dashboard

![Dashboard](docs/screenshots/Dashboard.png)

The vault dashboard showing balances, share position, and recent activity.

### Transaction Hash

![Transaction Hash](docs/screenshots/Transaction%20Hash.png)

A crop of the transaction hash / details as shown after a deposit.

### CI/CD pipeline

![CI/CD pipeline](docs/screenshots/CI%20CD%20pipeline.png)

Screenshot of the GitHub Actions workflow run showing the CI/CD pipeline for building, testing, and deploying the contract and frontend.

---

## Deployed Contract Information

- **Live Demo Link:** [https://stellarorbit.vercel.app/](https://stellarorbit.vercel.app/)
- **Orbit Vault Contract:** `CCFL7JYTNJSFRZGXNUYPBGUEUAJTO5QONF64ISGVFAJP52FZZCZND6AX`
- **Orbit Tranche (Yield Stripping) Contract:** `CBOSRRNB2OS6CE7LWDJJZCB6IYBYCNIUVRKSD7IPMIOUYJSH3DKL5F23`
- **Orbit Market (P2P Lending) Contract:** `CBU7OPCENTV6XT33IYNBNYVC7YU2PNQD4X22TBAI4R72Q2QBVMERLGWT`
- **Orbit PT Token:** `CDUJ6L2HPZLT5GK52EMTUQ4OENRTEGWMJVNPFOURX4PYYNI4V677MBM2`
- **Orbit YT Token:** `CDR6RDJQU7VKDUIJLBXM2ND5FX4X6AGM5GCDPL2S2HRL6U3VA6L4BZNG`
- **Test USDC Token:** `CBM6JPPGBESHXXPW6YKGSM2W6CVEL7KHQ6WDWXVDBSY2QWHD4K6R4N2I`
- **Stellar Expert Explorer:** [View Vault Contract](https://stellar.expert/explorer/testnet/contract/CCFL7JYTNJSFRZGXNUYPBGUEUAJTO5QONF64ISGVFAJP52FZZCZND6AX)
- **Network:** Stellar Testnet
- **Soroban RPC URL:** `https://soroban-testnet.stellar.org`

---

## Roadmap

| Level | Feature                                                           | Status    |
| ----- | ----------------------------------------------------------------- | --------- |
| L1–L2 | Wallet connect + vault foundation                                 | ✅ Done   |
| L3    | Full Soroban contract (deposit/withdraw/share math)               | ✅ Done   |
| L4    | Production MVP, admin panel, leaderboard, simulator, oracle panel | ✅ Done   |
| L5    | Real-time Event Polling & Supabase Auth Onboarding Flow           | ✅ Done   |
| L6    | **DeFi Super-Protocol**: Yield Tranching & Share Collateral Loans | ✅ Done   |
| L7    | Automated DEX rebalancing, Zap deposits, Mainnet launch           | 🔜 Future |

---

## Disclaimer

Testnet only. Not financial advice. Demo-mode share ledger lives in your browser; it disappears when `localStorage` is cleared. Real share state lives on-chain only once the contract is deployed and `VITE_ORBIT_VAULT_CONTRACT_ID` is configured.
