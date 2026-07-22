<div align="center">

# Orbit Protocol

### Full-Stack RWA & Yield Protocol on Stellar Soroban

Earn real yield · Yield Tranching · Peer-to-Peer Collateral Lending · Built on Stellar Testnet

[![Live Demo](https://img.shields.io/badge/Live%20Demo-stellarorbit.vercel.app-6366f1?style=flat-square)](https://stellarorbit.vercel.app/)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-ff0000?style=flat-square&logo=youtube)](https://youtu.be/Git4e0q-HzY)
[![Feedback Form](https://img.shields.io/badge/User%20Feedback-Google%20Sheets-22c55e?style=flat-square)](https://docs.google.com/spreadsheets/d/e/2PACX-1vR82azl8byhjpi6hAnn8naPIsU5H-I_TGDyDFqdP2jv7xJXpp5O1MSdHBfHmFYH0v7Bka2FSSyrEbS2/pubhtml?gid=1828213795&single=true)
[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-0ea5e9?style=flat-square)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Contracts-Soroban-8b5cf6?style=flat-square)](https://soroban.stellar.org)
[![PWA](https://img.shields.io/badge/PWA-Supported-10b981?style=flat-square)](#)

[Watch Full Demo on YouTube](https://youtu.be/Git4e0q-HzY) · [Submit / View User Feedback](https://docs.google.com/spreadsheets/d/e/2PACX-1vR82azl8byhjpi6hAnn8naPIsU5H-I_TGDyDFqdP2jv7xJXpp5O1MSdHBfHmFYH0v7Bka2FSSyrEbS2/pubhtml?gid=1828213795&single=true)

</div>

---

## Overview

Orbit is a decentralized finance protocol built natively on Stellar using Soroban smart contracts. It provides a complete yield vault, yield tranching, and collateralized money market stack:

1. **Vault Deposits**: Deposit XLM into Soroban vaults to generate real yield via Blend Protocol cross-contract lending.
2. **Yield Tranching**: Wrap vault shares into Principal Tokens (PT) and Yield Tokens (YT) to separate base capital from variable yield.
3. **P2P Collateralized Lending**: Use PT or YT tokens as collateral to borrow USDC in a trustless money market without liquidators.
4. **On-Chain Analytics**: Real-time TVL, volume, APY tracking, and global leaderboards derived directly from live Soroban ledger events.

---

## Live Deployment

| Resource | Details |
|----------|---------|
| **Live Web App** | [stellarorbit.vercel.app](https://stellarorbit.vercel.app/) |
| **Demo Video** | [Watch on YouTube](https://youtu.be/Git4e0q-HzY) |
| **User Feedback Form** | [View / Submit Feedback](https://docs.google.com/spreadsheets/d/e/2PACX-1vR82azl8byhjpi6hAnn8naPIsU5H-I_TGDyDFqdP2jv7xJXpp5O1MSdHBfHmFYH0v7Bka2FSSyrEbS2/pubhtml?gid=1828213795&single=true) |
| **Network** | Stellar Testnet |
| **Soroban RPC** | `https://soroban-testnet.stellar.org` |
| **Latest Verified Transaction** | [`3ae1b42a...d1d224`](https://stellar.expert/explorer/testnet/tx/3ae1b42a21f5364498bc5c4b72537e03f7c34578598f8c694ad919745cd1d224) |

---

## Smart Contract Deployments

All contracts are deployed on Stellar Testnet and fully integrated into the dApp.

| Contract | Address | Explorer |
|----------|---------|---------|
| **Orbit XLM Vault** | `CBLDIHKSHOXC3Q3R2YNCT54OPTX5QRALNYKK3UDNZ4KAQD7DEINJYV5P` | [View Contract](https://stellar.expert/explorer/testnet/contract/CBLDIHKSHOXC3Q3R2YNCT54OPTX5QRALNYKK3UDNZ4KAQD7DEINJYV5P) |
| **oXLM Share Token** | `CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ` | [View Contract](https://stellar.expert/explorer/testnet/contract/CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ) |
| **Orbit Tranche v2** | `CBOCF47NMQAT7TS4X4CTS7D3MPAD4MIPMOBZPUE5EOM52WTAIOOVJDCU` | [View Contract](https://stellar.expert/explorer/testnet/contract/CBOCF47NMQAT7TS4X4CTS7D3MPAD4MIPMOBZPUE5EOM52WTAIOOVJDCU) |
| **PT Token** | `CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL` | [View Contract](https://stellar.expert/explorer/testnet/contract/CDPI7TU3B7ZW3RMT3NINGI22MCBMKUI6L52YYDA7Y3ZCIRD4FQPT4JQL) |
| **YT Token** | `CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR` | [View Contract](https://stellar.expert/explorer/testnet/contract/CB6ZGGBSIB3EJYME3KI7MGKBJZELXI4HWGDSANLRZI74DULFKQZSRKCR) |
| **P2P Market** | `CBU7OPCENTV6XT33IYNBNYVC7YU2PNQD4X22TBAI4R72Q2QBVMERLGWT` | [View Contract](https://stellar.expert/explorer/testnet/contract/CBU7OPCENTV6XT33IYNBNYVC7YU2PNQD4X22TBAI4R72Q2QBVMERLGWT) |
| **Test USDC** | `CBM6JPPGBESHXXPW6YKGSM2W6CVEL7KHQ6WDWXVDBSY2QWHD4K6R4N2I` | [View Contract](https://stellar.expert/explorer/testnet/contract/CBM6JPPGBESHXXPW6YKGSM2W6CVEL7KHQ6WDWXVDBSY2QWHD4K6R4N2I) |

---

## Screenshots

### Landing Page
![Landing Page](docs/screenshots/landing.png)
> Orbit landing page hero with interactive orbit visualization and application entry points.

---

### App Dashboard
![Dashboard](docs/screenshots/dashboard.png)
> Primary application dashboard featuring share position tracking, oracle feeds, and network latency status.

---

### Deposit Flow
![Deposit Success](docs/screenshots/Deposit.png)
> Deposit interaction card displaying asset balance, share preview calculations, and confirmation details.

---

### Transaction Hash Details
![Transaction Hash](docs/screenshots/Transaction%20Hash.png)
> On-chain transaction confirmation detail with direct verification link to Stellar Expert.

---

### CI/CD Pipeline
![CI/CD Pipeline](docs/screenshots/CI%20CD%20pipeline.png)
> Continuous integration build and automated deployment workflow.

---

### Analytics Dashboard
![Analytics Dashboard](Screenshots/Analytic%20%20Dashboard.png)
> Real-time TVL, deposit volume, and historical APY metrics generated from Soroban RPC event polling.

---

### Yield Tracking
![Yield Tracking](Screenshots/Yeild%20Tracking.png)
> Real-time Principal Token (PT) and Yield Token (YT) position monitoring and accrued return metrics.

---

### P2P Lending Market
![P2P Lending Market](Screenshots/P2p%20lending%20market.png)
> Peer-to-peer money market interface for creating fixed-term loan offers and borrowing against collateral.

---

### Portfolio Analyzer
![Portfolio Analyzer](Screenshots/Portfolio%20Analyzer.png)
> Portfolio breakdown and compound growth projection tools.

---

### Vault Health Monitor
![Vault Health Monitor](Screenshots/Vault%20Health%20Monitor.png)
> Live vault state telemetry including utilization rates, idle balances, and performance fee metrics.

---

### Global Leaderboard
![Leaderboard](Screenshots/leaderboard.png)
> Participant standings calculated dynamically from on-chain contract events.

---

### Points & Referral System
![Referral Points](Screenshots/referal%20point.png)
> Protocol gamification interface tracking earned points and referral activity.

---

### Transaction History
![Transaction History](Screenshots/transaction%20History.png)
> Searchable history of deposits and redemptions.

---

### Transaction Confirmation
![Transaction](Screenshots/Transaction.png)
> Transaction status modal containing receipt data and block explorer links.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            USER FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

  User Wallet (Freighter / Albedo / Lobstr / xBull)
        │
        ▼
  ┌─────────────┐     Deposit XLM      ┌──────────────────────────────┐
  │  Orbit App  │ ──────────────────▶  │   orbit-vault (Soroban)      │
  │ (TanStack)  │                      │                              │
  │             │ ◀──────────────────  │  • Mints oXLM share tokens   │
  └─────────────┘   Mint oXLM shares   │  • Tracks TVL & Share NAV    │
        │                              │  • Manages yield strategy    │
        │                              └──────────────┬───────────────┘
        │                                             │
        │                                             │ Yield Strategy
        │                                             ▼
        │                              ┌──────────────────────────────┐
        │                              │     Blend Protocol Pool      │
        │                              │  (Cross-Contract Lending)    │
        │                              └──────────────────────────────┘
        │
        │  YIELD TRANCHING
        │
        ├──── Wrap Shares ───────────▶ ┌──────────────────────────────┐
        │                              │  orbit-tranche (Soroban)     │
        │   ┌─── PT Token (Principal)─ │                              │
        │   │                          │  Splits oXLM into:           │
        │   └─── YT Token (Yield)───── │  • PT: Fixed Principal value │
        │                              │  • YT: Variable Yield claims │
        │                              └──────────────────────────────┘
        │
        │  P2P MONEY MARKET
        │
        └──── Create Offer / Borrow ─▶ ┌──────────────────────────────┐
                                       │  orbit-market (Soroban)      │
                                       │  • Trustless Escrow          │
                                       │  • Fixed Terms & Collateral  │
                                       └──────────────────────────────┘

─────────────────────────────────────────────────────────────────────
                     DATA INFRASTRUCTURE
─────────────────────────────────────────────────────────────────────

  Soroban RPC ──▶ fetchContractEvents() ──▶ Analytics & Leaderboards
  Supabase ──▶ User Profiles & Auth ──▶ Global Leaderboard Names
  SEP-40 Oracle ──▶ XLM/USD Price Feed ──▶ Portfolio Valuation
```

---

## Key Features

| Component | Functionality |
|-----------|---------------|
| **Multi-Wallet Support** | Integrated via StellarWalletsKit for seamless connection across wallets. |
| **Soroban Smart Vaults** | SEP-41 compliant `oXLM` share token minting with NAV calculations. |
| **Yield Tranching** | Split shares into PT (principal protection) and YT (yield speculation) tokens. |
| **P2P Collateral Market** | Escrow-based lending market utilizing PT/YT tokens as collateral. |
| **Live Event Polling** | Real-time on-chain indexing without third-party middleware. |
| **Mobile PWA** | Progressive Web App support for mobile and desktop environments. |
| **SEP-40 Price Oracles** | Live USD valuation of vault assets and user share balances. |

---

## Technical Setup

### Prerequisites

- Node.js 20+
- Rust with `wasm32v1-none` compilation target
- `stellar-cli` v27+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Sristipriya/stellarorbit.git
cd stellarorbit

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run development server
npm run dev
```

---

## Contract Build Commands

```bash
# Build tranche contract
stellar contract build --package orbit-tranche

# Build vault contract
stellar contract build --package orbit-vault

# Deploy to Testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/orbit_vault.wasm \
  --source-account orbit-deployer \
  --network testnet
```

---

## License & Disclaimer

Testnet deployment built for demonstration and evaluation purposes. All assets are on Stellar Testnet and carry no monetary value.
