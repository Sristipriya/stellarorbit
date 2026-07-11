# Orbit — Multi-Asset RWA Index Vault on Stellar Testnet

> _Index vault for on-chain assets on Stellar. Soroban-powered, multi-wallet, fully production-ready._

[![Live Demo](https://img.shields.io/badge/Live%20Demo-stellarorbit.vercel.app-8af)](https://stellarorbit.vercel.app/)
[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-blue)](https://stellar.org)
[![Contract](https://img.shields.io/badge/Soroban-Testnet%20Contract-purple)](https://stellar.expert/explorer/testnet/contract/CAEVXCBXW6CFCOELPQQ2D2KZ6JVVT5T6RQA5NCD3WGG6JJ5UC3XZD4OJ)

Orbit is a **Soroban-powered single-asset index vault** deployed on **Stellar Testnet**, architected to grow into a multi-asset RWA index using SEP-40 oracles. Connect a Stellar wallet, fund via Friendbot, deposit XLM into the vault contract, receive shares, and withdraw at current share NAV.

---

## Live Deployment

| Resource              | Value |
|-----------------------|-------|
| **Live Demo**         | https://stellarorbit.vercel.app/ |
| **Contract Address**  | `CAEVXCBXW6CFCOELPQQ2D2KZ6JVVT5T6RQA5NCD3WGG6JJ5UC3XZD4OJ` |
| **Admin Panel**       | https://stellarorbit.vercel.app/admin/ |
| **Network**           | Stellar Testnet |
| **Soroban RPC**       | `https://soroban-testnet.stellar.org` |

---

## Features

### User-Facing
- **Multi-Wallet Support** — Connect via StellarWalletsKit (Freighter, Albedo, xBull, Lobstr)
- **Live On-Chain Data** — Real-time XLM balance, vault shares, TVL from Soroban RPC
- **Deposit & Withdraw** — Soroban contract calls with wallet signing; preview shares before submitting
- **Share Certificate** — Visual ownership card with copy-to-clipboard and USD equivalent value
- **SEP-40 Oracle Panel** — Live XLM/USD price feed converts TVL and share price into USD
- **Vault Simulator** — What-if calculator: project returns over time with a chart
- **Leaderboard** — Ranked depositor table derived from on-chain events (no backend)
- **Transaction History** — Full deposit/withdrawal history with explorer links
- **Notification Center** — In-app bell with unread badge; tracks deposits, withdrawals, errors
- **Network Status Bar** — Live Soroban RPC latency, color-coded dot, and latest ledger number
- **Testnet Faucet** — One-click Friendbot funding for new accounts
- **Skeleton Loading** — Animated placeholders while vault data loads
- **Toast Notifications** — Sonner toasts on every deposit/withdraw success or error
- **Mobile Bottom Navigation** — Fixed bottom tab bar on small screens
- **Responsive Sidebar** — Slide-in drawer on mobile, persistent sidebar on desktop

### Admin Panel (`/admin/`)
- **Protected Login** — Credential check against `VITE_ADMIN_USER` / `VITE_ADMIN_PASS`
- **KPI Dashboard** — TVL, unique wallets, total deposits, withdrawals, share price, tx count
- **7-Day Volume Chart** — Bar chart of deposit vs withdrawal volume by day
- **Vault Health Card** — Contract ID, RPC URL, mode, live NAV metrics
- **Transaction Table** — Filterable by type, searchable, CSV export
- **User Analytics** — Unique wallets ranked by deposit volume
- **RPC Health Check** — Live latency ping with status indicator

---

## Architecture

```text
 ┌────────────────┐   sign tx (XDR)    ┌──────────────────────────────────┐
 │ Stellar wallet │ ◀───────────────── │  Orbit web app (TanStack Start)  │
 │ (Freighter,    │ ─signed XDR──────▶ │  / landing · /app dashboard      │
 │  Albedo, xBull,│                    │  /admin analytics panel          │
 │  Lobstr)       │                    └──────────┬───────────────────────┘
 └────────────────┘                               │ Horizon / Soroban RPC
                                                  ▼
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
│   │   ├── app.tsx            Vault dashboard route
│   │   └── admin/
│   │       ├── index.tsx      Admin dashboard (KPIs, charts, vault health)
│   │       ├── transactions.tsx Admin transaction table
│   │       ├── users.tsx      Admin user analytics
│   │       └── settings.tsx   RPC health, network config
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
│   │   ├── admin/
│   │   │   ├── AdminLoginPage.tsx   Credential login form
│   │   │   ├── AdminLayout.tsx      Admin sidebar + mobile header
│   │   │   ├── StatsGrid.tsx        KPI card grid
│   │   │   ├── ActivityChart.tsx    7-day deposit/withdrawal bar chart
│   │   │   ├── TransactionTable.tsx Filterable + searchable tx table + CSV export
│   │   │   ├── UniqueUsersPanel.tsx Unique wallet list sorted by volume
│   │   │   └── VaultHealthCard.tsx  Contract ID, mode, RPC, NAV metrics
│   │   └── ui/
│   │       └── ...                  shadcn/ui primitives
│   │
│   ├── hooks/
│   │   ├── use-vault.ts       Vault state polling (15s) + event polling (8s)
│   │   ├── use-wallet.ts      Wallet connect/disconnect, balance refresh
│   │   └── use-mobile.tsx     Mobile breakpoint hook
│   │
│   ├── lib/
│   │   ├── admin-auth.ts      Admin credential check (sessionStorage)
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

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_ORBIT_VAULT_CONTRACT_ID` | No | `""` | Deployed Soroban contract ID. If unset, runs in demo mode. |
| `VITE_ADMIN_USER` | No | `admin` | Admin panel login username. |
| `VITE_ADMIN_PASS` | No | `orbit2024` | Admin panel login password. |

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

| Mode | `VITE_ORBIT_VAULT_CONTRACT_ID` | Share state | Activity |
|------|-------------------------------|-------------|----------|
| **Real** | Set to deployed contract | On-chain via Soroban RPC | Soroban contract events |
| **Demo** | Not set | `localStorage` | Horizon memo-tagged payments |

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
- **Deployed Contract Address:** `CAEVXCBXW6CFCOELPQQ2D2KZ6JVVT5T6RQA5NCD3WGG6JJ5UC3XZD4OJ`
- **Recent Transaction Hash:** `4cbeda5d4223cca5235c8f5dad269de26e6373b2369c3ce483ffc092aacb46a3`
- **Network:** Stellar Testnet
- **Soroban RPC URL:** `https://soroban-testnet.stellar.org`

---

## Roadmap

| Level | Feature | Status |
|-------|---------|--------|
| L1–L2 | Wallet connect + vault foundation | ✅ Done |
| L3 | Full Soroban contract (deposit/withdraw/share math) | ✅ Done |
| L4 | Production MVP, admin panel, leaderboard, simulator, oracle panel | ✅ Done |
| L5 | Multi-asset baskets, SEP-40 full oracle integration | 🔜 Next |
| L6 | Automated DEX rebalancing, Zap deposits, Mainnet launch | 🔜 Future |

---

## Disclaimer

Testnet only. Not financial advice. Demo-mode share ledger lives in your browser; it disappears when `localStorage` is cleared. Real share state lives on-chain only once the contract is deployed and `VITE_ORBIT_VAULT_CONTRACT_ID` is configured.
