#![no_std]
//! Orbit — single-asset index vault on Soroban.
//!
//! State:
//!   - total_assets      : i128  (asset stroops held by vault)
//!   - total_shares      : i128  (shares outstanding)
//!   - balances          : Map<Address, i128>
//!   - assets_lent       : i128  (deployed to yield strategy)
//!   - admin             : Address
//!   - fee_recipient     : Address
//!   - perf_fee_bps      : u32   (performance fee in basis points, e.g. 1000 = 10%)
//!   - price_history     : Vec<PriceSnapshot>
//!
//! Functions:
//!   - deposit(from, amount)       -> i128 (shares minted)
//!   - withdraw(from, shares)      -> i128 (assets returned)
//!   - balance_of(who)             -> i128
//!   - total_assets()              -> i128
//!   - total_shares()              -> i128
//!   - preview_share_price()       -> i128 (assets per share, scaled by 1e7)
//!   - get_apy_bps()               -> i128 (annualised 7d APY in bps, e.g. 500 = 5%)
//!   - get_price_history()         -> Vec<PriceSnapshot>
//!   - invest(admin, amount)       -> unit (stub: track deployed capital)
//!   - divest(admin, amount)       -> unit (stub: recall deployed capital)
//!   - harvest(admin, yield_amt)   -> unit (inject profit, deduct fee)

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, vec, Address, Env, Map, Vec,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Asset,
    TotalAssets,
    TotalShares,
    ShareToken,
    AssetsLent,
    Admin,
    FeeRecipient,
    PerfFeeBps,
    PriceHistory,
    ManagementFeeBps,
    BlendPool,
    Referrer(Address), // maps user -> referrer
}

#[soroban_sdk::contractclient(name = "ShareTokenClient")]
pub trait ShareTokenInterface {
    fn mint(minter: Address, to: Address, amount: i128);
    fn burn(minter: Address, from: Address, amount: i128);
    fn balance(id: Address) -> i128;
}

#[soroban_sdk::contractclient(name = "BlendPoolClient")]
pub trait BlendPoolInterface {
    fn supply(from: Address, reserve: Address, amount: i128);
    fn withdraw(from: Address, reserve: Address, amount: i128, to: Address);
}

#[derive(Clone)]
#[contracttype]
pub struct PriceSnapshot {
    pub timestamp: u64,
    /// Price per share scaled by 1e7 (same as STROOPS_PER_XLM).
    pub price_scaled: i128,
}

const SCALE: i128 = 10_000_000; // 1e7 — matches XLM stroop scale
const MAX_HISTORY: u32 = 90; // keep 90 snapshots (≈90 harvests)

#[contract]
pub struct OrbitVault;

#[contractimpl]
impl OrbitVault {
    /// Initialise the vault.
    ///
    /// * `asset`         – Stellar Asset Contract address (e.g. native XLM SAC)
    /// * `admin`         – address allowed to call invest/divest/harvest
    /// * `fee_recipient` – address that receives the performance fee cut
    /// * `perf_fee_bps`  – performance fee in basis points (0–5000, max 50%)
    /// * `share_token`   – the SEP-41 share token contract address
    pub fn __constructor(
        env: Env,
        asset: Address,
        admin: Address,
        fee_recipient: Address,
        perf_fee_bps: u32,
        share_token: Address,
    ) {
        assert!(perf_fee_bps <= 5000, "fee must not exceed 50%");
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::TotalAssets, &0_i128);
        env.storage().instance().set(&DataKey::TotalShares, &0_i128);
        env.storage().instance().set(&DataKey::AssetsLent, &0_i128);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeeRecipient, &fee_recipient);
        env.storage().instance().set(&DataKey::PerfFeeBps, &perf_fee_bps);
        env.storage().instance().set(&DataKey::ShareToken, &share_token);
        // Default management fee to 0 bps initially
        env.storage().instance().set(&DataKey::ManagementFeeBps, &0_u32);
        env.storage()
            .instance()
            .set(&DataKey::PriceHistory, &vec![&env] as &Vec<PriceSnapshot>);
    }

    pub fn set_blend_pool(env: Env, admin: Address, pool: Address) {
        admin.require_auth();
        Self::assert_admin(&env, &admin);
        env.storage().instance().set(&DataKey::BlendPool, &pool);
    }

    pub fn set_management_fee(env: Env, admin: Address, bps: u32) {
        admin.require_auth();
        Self::assert_admin(&env, &admin);
        assert!(bps <= 5000, "management fee too high");
        env.storage().instance().set(&DataKey::ManagementFeeBps, &bps);
    }

    // ─────────────────────────── Deposit ────────────────────────────────────

    pub fn deposit(env: Env, from: Address, amount: i128, referrer: Option<Address>) -> i128 {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");

        let total_assets: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0);
        let total_shares: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);
        let shares = preview_deposit(amount, total_assets, total_shares);

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        token::Client::new(&env, &asset).transfer(&from, &env.current_contract_address(), &amount);

        env.storage()
            .instance()
            .set(&DataKey::TotalAssets, &(total_assets + amount));
        env.storage()
            .instance()
            .set(&DataKey::TotalShares, &(total_shares + shares));

        // Save referrer if not already set and referrer is not self
        if let Some(r) = referrer {
            if r != from {
                let key = DataKey::Referrer(from.clone());
                if !env.storage().instance().has(&key) {
                    env.storage().instance().set(&key, &r);
                }
            }
        }
        
        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();
        let client = ShareTokenClient::new(&env, &share_token);
        client.mint(&env.current_contract_address(), &from, &shares);

        env.events()
            .publish((symbol_short!("Dep"),), (from, amount, shares));
        shares
    }

    // ─────────────────────────── Withdraw ───────────────────────────────────

    pub fn withdraw(env: Env, from: Address, shares: i128) -> i128 {
        from.require_auth();
        assert!(shares > 0, "shares must be positive");

        let total_assets: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0);
        let total_shares: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);
        assert!(total_shares > 0, "vault empty");

        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();
        let client = ShareTokenClient::new(&env, &share_token);
        let user_shares = client.balance(&from);
        assert!(shares <= user_shares, "insufficient shares");

        let assets_lent: i128 = env
            .storage()
            .instance()
            .get(&DataKey::AssetsLent)
            .unwrap_or(0);
        let idle_assets = total_assets - assets_lent;
        let assets_out = preview_redeem(shares, total_assets, total_shares);
        assert!(
            assets_out <= idle_assets,
            "insufficient idle assets; divest required first"
        );

        client.burn(&env.current_contract_address(), &from, &shares);

        env.storage()
            .instance()
            .set(&DataKey::TotalShares, &(total_shares - shares));
        env.storage()
            .instance()
            .set(&DataKey::TotalAssets, &(total_assets - assets_out));

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        token::Client::new(&env, &asset).transfer(
            &env.current_contract_address(),
            &from,
            &assets_out,
        );

        env.events()
            .publish((symbol_short!("Wd"),), (from, assets_out, shares));
        assets_out
    }

    // ─────────────────────────── Read-only views ─────────────────────────────

    pub fn balance_of(env: Env, who: Address) -> i128 {
        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();
        let client = ShareTokenClient::new(&env, &share_token);
        client.balance(&who)
    }

    pub fn total_assets(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0)
    }

    pub fn total_shares(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0)
    }

    pub fn assets_lent(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::AssetsLent)
            .unwrap_or(0)
    }

    /// Price per share scaled by 1e7. Returns 1.0 (1e7) before first deposit.
    pub fn preview_share_price(env: Env) -> i128 {
        let ta: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0);
        let ts: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);
        price_per_share(ta, ts)
    }

    /// Returns up to the last 90 price snapshots recorded on each harvest.
    pub fn get_price_history(env: Env) -> Vec<PriceSnapshot> {
        env.storage()
            .instance()
            .get(&DataKey::PriceHistory)
            .unwrap_or(vec![&env])
    }

    /// Returns 7-day annualised APY in basis points (e.g. 500 = 5% APY).
    /// Returns 0 if fewer than 2 snapshots or the window is less than 1 hour.
    pub fn get_apy_bps(env: Env) -> i128 {
        let history: Vec<PriceSnapshot> = env
            .storage()
            .instance()
            .get(&DataKey::PriceHistory)
            .unwrap_or(vec![&env]);

        if history.len() < 2 {
            return 0;
        }

        let latest = history.get(history.len() - 1).unwrap();
        // Look for a snapshot ≥7 days ago; fall back to oldest available.
        let seven_days_secs: u64 = 7 * 24 * 3600;
        let target_ts = latest.timestamp.saturating_sub(seven_days_secs);

        let mut baseline = history.get(0).unwrap();
        for i in 0..history.len() {
            let snap = history.get(i).unwrap();
            if snap.timestamp >= target_ts {
                break;
            }
            baseline = snap;
        }

        // Avoid division by zero and tiny time windows (< 1 hour).
        let elapsed = latest.timestamp.saturating_sub(baseline.timestamp);
        if elapsed < 3600 || baseline.price_scaled == 0 {
            return 0;
        }

        // APY (bps) = ((p_now / p_then) - 1) * (seconds_in_year / elapsed) * 10_000
        // Use integer scaled arithmetic: multiply by 1e12 to preserve precision.
        let seconds_in_year: i128 = 365 * 24 * 3600;
        let elapsed_i128 = elapsed as i128;
        let ratio_scaled = (latest.price_scaled * 1_000_000_i128) / baseline.price_scaled;
        let growth_scaled = ratio_scaled - 1_000_000_i128; // fractional gain * 1e6
        let apy_bps =
            (growth_scaled * seconds_in_year * 10_000_i128) / (elapsed_i128 * 1_000_000_i128);

        apy_bps
    }

    // ─────────────────────────── Admin — Yield strategy ──────────────────────

    /// Mark XLM as deployed to external yield strategy.
    pub fn invest(env: Env, admin: Address, amount: i128) {
        admin.require_auth();
        Self::assert_admin(&env, &admin);
        assert!(amount > 0, "must invest positive amount");

        let total_assets: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0);
        let assets_lent: i128 = env
            .storage()
            .instance()
            .get(&DataKey::AssetsLent)
            .unwrap_or(0);
        let idle_assets = total_assets - assets_lent;
        assert!(amount <= idle_assets, "insufficient idle assets to invest");

        // Real Blend integration
        if let Some(pool) = env.storage().instance().get::<_, Address>(&DataKey::BlendPool) {
            let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
            let blend = BlendPoolClient::new(&env, &pool);
            blend.supply(&env.current_contract_address(), &asset, &amount);
        }

        env.storage()
            .instance()
            .set(&DataKey::AssetsLent, &(assets_lent + amount));
        env.events().publish((symbol_short!("Invest"),), (amount,));
    }

    /// Recall XLM from yield strategy.
    pub fn divest(env: Env, admin: Address, amount: i128) {
        admin.require_auth();
        Self::assert_admin(&env, &admin);
        assert!(amount > 0, "must divest positive amount");

        let assets_lent: i128 = env
            .storage()
            .instance()
            .get(&DataKey::AssetsLent)
            .unwrap_or(0);
        assert!(amount <= assets_lent, "insufficient lent assets");

        // Real Blend integration
        if let Some(pool) = env.storage().instance().get::<_, Address>(&DataKey::BlendPool) {
            let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
            let blend = BlendPoolClient::new(&env, &pool);
            blend.withdraw(&env.current_contract_address(), &asset, &amount, &env.current_contract_address());
        }

        env.storage()
            .instance()
            .set(&DataKey::AssetsLent, &(assets_lent - amount));
        env.events().publish((symbol_short!("Divest"),), (amount,));
    }

    /// Inject yield into vault, deduct performance fee, record price snapshot.
    ///
    /// Admin must have approved the contract to pull `yield_amount` tokens
    /// from their wallet (via token allowance / auth).
    pub fn harvest(env: Env, admin: Address, yield_amount: i128) {
        admin.require_auth();
        Self::assert_admin(&env, &admin);
        assert!(yield_amount > 0, "yield must be positive");

        let perf_fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::PerfFeeBps)
            .unwrap_or(0);
        let mgmt_fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ManagementFeeBps)
            .unwrap_or(0);

        let total_assets: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAssets)
            .unwrap_or(0);

        // Calculate performance fee from gross yield
        let perf_fee_amount = (yield_amount * perf_fee_bps as i128) / 10_000_i128;
        
        // Calculate annualized management fee (approximation per harvest)
        // A full implementation would scale this by time since last harvest. 
        // For Layer 1, we just apply the BPS on the AUM for the period.
        let mgmt_fee_amount = (total_assets * mgmt_fee_bps as i128) / 10_000_i128;
        
        let total_fee_amount = perf_fee_amount + mgmt_fee_amount;

        // Note: if yield is less than mgmt fee, net yield could be negative (value erosion), 
        // but for simplicity we cap it so we don't try to pull more than yield_amount.
        let total_fee_amount = if total_fee_amount > yield_amount { yield_amount } else { total_fee_amount };
        let net_yield = yield_amount - total_fee_amount;

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let token = token::Client::new(&env, &asset);

        // Pull gross yield from admin wallet.
        token.transfer(&admin, &env.current_contract_address(), &yield_amount);

        // Pay fee to fee_recipient.
        if total_fee_amount > 0 {
            // For a production ready vault, we would iterate through all users, 
            // calculate their share of the profit, check their referrer, 
            // and distribute 10% of their specific performance fee to their referrer.
            // Since this is a simple vault without per-user profit tracking on-chain,
            // we will send the entire fee to the protocol fee_recipient. 
            // The off-chain Points engine will handle the 10% referral bonus distribution 
            // via the award_points RPC in Supabase (which was built in Phase 3).
            let fee_recipient: Address = env
                .storage()
                .instance()
                .get(&DataKey::FeeRecipient)
                .unwrap();
            token.transfer(&env.current_contract_address(), &fee_recipient, &total_fee_amount);
        }

        // Credit net yield to vault.
        let new_total = total_assets + net_yield;
        env.storage()
            .instance()
            .set(&DataKey::TotalAssets, &new_total);

        // Record price snapshot.
        let total_shares: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);
        let snap = PriceSnapshot {
            timestamp: env.ledger().timestamp(),
            price_scaled: price_per_share(new_total, total_shares),
        };
        let mut history: Vec<PriceSnapshot> = env
            .storage()
            .instance()
            .get(&DataKey::PriceHistory)
            .unwrap_or(vec![&env]);
        // Keep only last MAX_HISTORY entries (sliding window).
        if history.len() >= MAX_HISTORY {
            // Remove oldest entry by rebuilding without it.
            let mut trimmed: Vec<PriceSnapshot> = Vec::new(&env);
            for i in 1..history.len() {
                trimmed.push_back(history.get(i).unwrap());
            }
            history = trimmed;
        }
        history.push_back(snap);
        env.storage()
            .instance()
            .set(&DataKey::PriceHistory, &history);

        env.events()
            .publish((symbol_short!("Harvest"),), (yield_amount, total_fee_amount));
    }

    // ─────────────────────────── Internal helpers ─────────────────────────────

    fn assert_admin(env: &Env, caller: &Address) {
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(*caller == stored_admin, "unauthorized");
    }
}

fn preview_deposit(amount: i128, total_assets: i128, total_shares: i128) -> i128 {
    if total_shares == 0 || total_assets == 0 {
        amount
    } else {
        (amount * total_shares) / total_assets
    }
}

fn preview_redeem(shares: i128, total_assets: i128, total_shares: i128) -> i128 {
    if total_shares == 0 {
        0
    } else {
        (shares * total_assets) / total_shares
    }
}

fn price_per_share(total_assets: i128, total_shares: i128) -> i128 {
    if total_shares == 0 {
        SCALE
    } else {
        (total_assets * SCALE) / total_shares
    }
}

#[cfg(test)]
mod test;
