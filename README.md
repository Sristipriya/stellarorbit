# Orbit — Index Vault on Stellar Testnet

> _Index vault for on-chain assets on Stellar._

Orbit is a Soroban-powered single-asset index vault deployed on **Stellar
Testnet**, architected to grow into a multi-asset RWA index using SEP-40
oracles. Connect a Stellar wallet, fund via Friendbot, deposit XLM into the
vault contract, receive shares, and withdraw at share value.

## Architecture

```text
 ┌────────────────┐   sign tx (XDR)    ┌──────────────────────┐
 │ Stellar wallet │ ◀───────────────── │  Orbit web app       │
 │ (Freighter,    │ ─signed XDR──────▶ │  (TanStack Start)    │
 │  Albedo, xBull,│                    │  /  + /app routes    │
 │  Lobstr)       │                    └──────────┬───────────┘
 └────────────────┘                               │ Horizon / Soroban RPC
                                                  ▼
                                       ┌──────────────────────┐
                                       │  Soroban contract    │
                                       │  contracts/orbit-vault│
                                       │  deposit / withdraw   │
                                       │  balance_of / price   │
                                       └──────────┬───────────┘
                                                  ▼
                                       ┌──────────────────────┐
                                       │  L4+ : SEP-40 oracles│
                                       │  multi-asset RWA NAV │
                                       └──────────────────────┘
```

## Repository layout

```text
contracts/orbit-vault/   Rust Soroban contract + tests (see its README)
src/routes/index.tsx     Landing page
src/routes/app.tsx       Vault dashboard
src/components/orbit/    Hero animation, cards, forms, activity feed, wallet UI
src/hooks/               useWallet, useVault
src/lib/stellar/         network · wallet kit · friendbot · balance · vault service
```

## How Orbit satisfies the belt levels

### Level 1 (White Belt)
- **Freighter on Testnet**: connect via StellarWalletsKit's modal (Freighter included).
- **Display XLM balance**: `Your Position` card shows live wallet balance, polled every 12s.
- **Send a Testnet XLM transaction with visible result**: every deposit and withdraw signs and submits a real Testnet transaction (a 1-stroop self-payment with an `orbit:dep:<amount>` memo when the contract isn't yet deployed; a Soroban invocation once `VITE_ORBIT_VAULT_CONTRACT_ID` is set). On success, the UI shows the tx hash and a stellar.expert link; on failure, a human-readable error.

### Level 2 (Yellow Belt)
- **Multi-wallet via StellarWalletsKit**: Freighter, Albedo, xBull, Lobstr — wired into the kit's `authModal()`.
- **Robust error handling**: `classifyError()` distinguishes wallet-not-installed, user-rejected, insufficient-balance, network errors, with red error cards in the UI and a collapsible developer-debug section.
- **Soroban contract called from frontend**: deposit / withdraw paths are typed to a single service interface so swapping the demo path for the live contract requires only setting `VITE_ORBIT_VAULT_CONTRACT_ID`.
- **Transaction status visible**: pending → success / failure card with tx hash and explorer link.
- **Event-driven UI**: vault activity feed reacts in real-time via an event bus; the same hook will subscribe to `getEvents` once the contract is deployed.

### Level 3-ready
- Contract source in `contracts/orbit-vault/` with state, functions, and events exactly as specified:
  `deposit(amount)`, `withdraw(shares)`, `balance_of(user)`, `preview_share_price()`, plus `Deposited` / `Withdrawn` events.
- Unit tests cover share math, deposits, withdraws, and over-withdraw guards.
- Code layout (typed `VaultState`, `ActivityEvent`, single service module) is ready for multi-asset extension — see `contracts/orbit-vault/README.md` for L4+ hooks.

## Setup

### Prerequisites
- Node 20+, `bun` (or `pnpm`)
- Rust + `wasm32-unknown-unknown` target
- `stellar-cli` (`cargo install --locked stellar-cli`) and `jq`
- A Stellar wallet extension (Freighter recommended)

### One-command setup (fresh clone)

```bash
scripts/setup.sh
bun run dev   # http://localhost:8080
```

`scripts/setup.sh` installs JS deps, runs the contract tests, deploys the
Soroban vault to Stellar Testnet, and writes `VITE_ORBIT_VAULT_CONTRACT_ID`
into `.env` so the frontend talks to the live contract on next start.

If you only want to run the UI in demo mode (no contract deploy):

```bash
scripts/setup.sh --skip-deploy
bun run dev
```

### Deploy / redeploy only the contract

```bash
scripts/deploy-vault.sh                 # uses identity "orbit-deployer"
scripts/deploy-vault.sh my-identity     # use a different stellar-cli identity
```

This builds `contracts/orbit-vault`, funds the deployer via Friendbot,
uploads + deploys the WASM with the native XLM SAC as the underlying asset,
and updates `.env` in place. See
[`contracts/orbit-vault/README.md`](contracts/orbit-vault/README.md) for the
underlying `stellar contract` commands.

### Modes

- **Real mode** (`VITE_ORBIT_VAULT_CONTRACT_ID` set): the UI reads
  `total_assets` / `total_shares` / `balance_of` directly from the contract,
  deposits/withdrawals call the contract via Soroban RPC + wallet signing,
  and the activity feed reconciles from Soroban contract events.
- **Demo mode** (no contract ID): each deposit/withdraw is a real signed
  Testnet payment with an `orbit:dep:<xlm>` / `orbit:wd:<xlm>` memo and the
  activity feed reconciles from Horizon by reading those memos. Share state
  is held in `localStorage` until the contract is live.

## Screenshots

_(placeholders)_

- `docs/screenshots/landing.png` — Landing page hero with orbit animation.
- `docs/screenshots/connected.png` — Wallet connected + XLM balance.
- `docs/screenshots/deposit-success.png` — Deposit success card with tx hash.
- `docs/screenshots/dashboard.png` — Vault dashboard with your position.

## Disclaimer

Testnet only. Not financial advice. Demo-mode share ledger lives in your
browser; it disappears when localStorage is cleared. Real share state lives
on-chain only once the contract is deployed and `VITE_ORBIT_VAULT_CONTRACT_ID`
is configured.