#![no_std]
//! Orbit — single-asset index vault on Soroban.
//!
//! State:
//!   - total_assets : i128  (asset stroops held by vault)
//!   - total_shares : i128  (shares outstanding)
//!   - balances     : Map<Address, i128>
//!
//! Functions:
//!   - deposit(from, amount)   -> i128 (shares minted)
//!   - withdraw(from, shares)  -> i128 (assets returned)
//!   - balance_of(who)         -> i128
//!   - preview_share_price()   -> i128 (assets per share, scaled by 1e7)
//!
//! Events:
//!   - ("Dep", from, amount, shares)
//!   - ("Wd",  from, amount, shares)
//!
//! L3+ hooks (not implemented in L1/L2 scope):
//!   - SEP-40 oracle reads for multi-asset NAV
//!   - Multi-asset accounting via vector of (asset, balance, weight)
//!
//! This contract takes asset transfers via `token::Client` for a configured
//! asset (set at `__constructor`). For the Testnet build we point it at the
//! native XLM Stellar Asset Contract (SAC).

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Map,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Asset,
    TotalAssets,
    TotalShares,
    Balances,
}

const SCALE: i128 = 10_000_000; // 1e7 — matches XLM stroop scale

#[contract]
pub struct OrbitVault;

#[contractimpl]
impl OrbitVault {
    /// Initialise the vault with the underlying asset contract address.
    pub fn __constructor(env: Env, asset: Address) {
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::TotalAssets, &0_i128);
        env.storage().instance().set(&DataKey::TotalShares, &0_i128);
        env.storage().instance().set(&DataKey::Balances, &Map::<Address, i128>::new(&env));
    }

    pub fn deposit(env: Env, from: Address, amount: i128) -> i128 {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");

        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);
        let shares = preview_deposit(amount, total_assets, total_shares);

        // Pull tokens from depositor.
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        token::Client::new(&env, &asset).transfer(&from, &env.current_contract_address(), &amount);

        // Update state.
        env.storage().instance().set(&DataKey::TotalAssets, &(total_assets + amount));
        env.storage().instance().set(&DataKey::TotalShares, &(total_shares + shares));
        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balances)
            .unwrap_or(Map::new(&env));
        let cur = balances.get(from.clone()).unwrap_or(0);
        balances.set(from.clone(), cur + shares);
        env.storage().instance().set(&DataKey::Balances, &balances);

        env.events().publish((symbol_short!("Dep"),), (from, amount, shares));
        shares
    }

    pub fn withdraw(env: Env, from: Address, shares: i128) -> i128 {
        from.require_auth();
        assert!(shares > 0, "shares must be positive");

        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);
        assert!(total_shares > 0, "vault empty");

        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balances)
            .unwrap_or(Map::new(&env));
        let user_shares = balances.get(from.clone()).unwrap_or(0);
        assert!(shares <= user_shares, "insufficient shares");

        let assets_out = preview_redeem(shares, total_assets, total_shares);

        // Update state first (effects), then transfer (interaction).
        balances.set(from.clone(), user_shares - shares);
        env.storage().instance().set(&DataKey::Balances, &balances);
        env.storage().instance().set(&DataKey::TotalShares, &(total_shares - shares));
        env.storage().instance().set(&DataKey::TotalAssets, &(total_assets - assets_out));

        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        token::Client::new(&env, &asset).transfer(&env.current_contract_address(), &from, &assets_out);

        env.events().publish((symbol_short!("Wd"),), (from, assets_out, shares));
        assets_out
    }

    pub fn balance_of(env: Env, who: Address) -> i128 {
        let balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balances)
            .unwrap_or(Map::new(&env));
        balances.get(who).unwrap_or(0)
    }

    pub fn total_assets(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalAssets).unwrap_or(0)
    }
    pub fn total_shares(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0)
    }

    /// Assets per share, scaled by 1e7. Returns 1.0 (1e7) before first deposit.
    pub fn preview_share_price(env: Env) -> i128 {
        let total_assets: i128 = env.storage().instance().get(&DataKey::TotalAssets).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);
        if total_shares == 0 {
            SCALE
        } else {
            (total_assets * SCALE) / total_shares
        }
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

#[cfg(test)]
mod test;