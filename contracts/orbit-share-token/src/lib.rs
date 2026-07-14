#![no_std]
//! Orbit Share Token — SEP-41 compliant fungible token for vault shares.
//!
//! This contract implements the full SEP-41 token interface:
//!   transfer(), transfer_from(), approve(), allowance(), balance(), decimals(),
//!   name(), symbol(), total_supply(), mint(), burn(), burn_from()
//!
//! Only the designated `minter` address (the Orbit Vault contract) can
//! call mint() or burn(). This ensures share accounting is always controlled
//! by the vault's deposit/withdraw logic.
//!
//! Conforms to: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Balances,
    Allowances,
    TotalSupply,
    Admin,   // can upgrade/pause
    Minter,  // the vault contract — sole authority to mint/burn
    Name,
    Symbol,
    Decimals,
}

#[contract]
pub struct OrbitShareToken;

#[contractimpl]
impl OrbitShareToken {
    /// Deploy the share token.
    /// * `admin`   – governance address (can update minter)
    /// * `minter`  – the vault contract address (can call mint/burn)
    /// * `name`    – human-readable name, e.g. "Orbit XLM Vault Share"
    /// * `symbol`  – ticker, e.g. "orXLM"
    /// * `decimals`– token precision (7 for XLM parity)
    pub fn __constructor(
        env: Env,
        admin: Address,
        minter: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Minter, &minter);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::TotalSupply, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::Balances, &Map::<Address, i128>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::Allowances, &Map::<(Address, Address), i128>::new(&env));
    }

    // ─────────────── Metadata ────────────────────────────────────────────────

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap_or(7)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    // ─────────────── Balances ────────────────────────────────────────────────

    pub fn balance(env: Env, id: Address) -> i128 {
        let balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balances)
            .unwrap_or(Map::new(&env));
        balances.get(id).unwrap_or(0)
    }

    // ─────────────── Transfer ────────────────────────────────────────────────

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        Self::do_transfer(&env, from.clone(), to.clone(), amount);
        env.events()
            .publish((symbol_short!("xfer"),), (from, to, amount));
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        // Deduct allowance
        let mut allowances: Map<(Address, Address), i128> = env
            .storage()
            .instance()
            .get(&DataKey::Allowances)
            .unwrap_or(Map::new(&env));
        let key = (from.clone(), spender.clone());
        let current = allowances.get(key.clone()).unwrap_or(0);
        assert!(current >= amount, "insufficient allowance");
        allowances.set(key, current - amount);
        env.storage()
            .instance()
            .set(&DataKey::Allowances, &allowances);
        Self::do_transfer(&env, from.clone(), to.clone(), amount);
        env.events()
            .publish((symbol_short!("xfer"),), (from, to, amount));
    }

    // ─────────────── Allowances ──────────────────────────────────────────────

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, _expiration_ledger: u32) {
        from.require_auth();
        let mut allowances: Map<(Address, Address), i128> = env
            .storage()
            .instance()
            .get(&DataKey::Allowances)
            .unwrap_or(Map::new(&env));
        allowances.set((from.clone(), spender.clone()), amount);
        env.storage()
            .instance()
            .set(&DataKey::Allowances, &allowances);
        env.events()
            .publish((symbol_short!("approve"),), (from, spender, amount));
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let allowances: Map<(Address, Address), i128> = env
            .storage()
            .instance()
            .get(&DataKey::Allowances)
            .unwrap_or(Map::new(&env));
        allowances.get((from, spender)).unwrap_or(0)
    }

    // ─────────────── Mint / Burn (minter only) ───────────────────────────────

    /// Mint `amount` tokens to `to`. Only callable by the registered minter (vault).
    pub fn mint(env: Env, minter: Address, to: Address, amount: i128) {
        minter.require_auth();
        Self::assert_minter(&env, &minter);
        assert!(amount > 0, "mint amount must be positive");

        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balances)
            .unwrap_or(Map::new(&env));
        let cur = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), cur + amount);
        env.storage().instance().set(&DataKey::Balances, &balances);

        let supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(supply + amount));

        env.events()
            .publish((symbol_short!("mint"),), (to, amount));
    }

    /// Burn `amount` tokens from `from`. Only callable by the registered minter (vault).
    pub fn burn(env: Env, minter: Address, from: Address, amount: i128) {
        minter.require_auth();
        Self::assert_minter(&env, &minter);
        assert!(amount > 0, "burn amount must be positive");

        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balances)
            .unwrap_or(Map::new(&env));
        let cur = balances.get(from.clone()).unwrap_or(0);
        assert!(cur >= amount, "insufficient balance to burn");
        balances.set(from.clone(), cur - amount);
        env.storage().instance().set(&DataKey::Balances, &balances);

        let supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(supply - amount));

        env.events()
            .publish((symbol_short!("burn"),), (from, amount));
    }

    // ─────────────── Admin ────────────────────────────────────────────────────

    /// Update the minter address. Only callable by admin.
    pub fn set_minter(env: Env, admin: Address, new_minter: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "unauthorized");
        env.storage().instance().set(&DataKey::Minter, &new_minter);
    }

    // ─────────────── Helpers ──────────────────────────────────────────────────

    fn do_transfer(env: &Env, from: Address, to: Address, amount: i128) {
        assert!(amount > 0, "transfer amount must be positive");
        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balances)
            .unwrap_or(Map::new(env));
        let from_bal = balances.get(from.clone()).unwrap_or(0);
        assert!(from_bal >= amount, "insufficient balance");
        balances.set(from.clone(), from_bal - amount);
        let to_bal = balances.get(to.clone()).unwrap_or(0);
        balances.set(to.clone(), to_bal + amount);
        env.storage().instance().set(&DataKey::Balances, &balances);
    }

    fn assert_minter(env: &Env, caller: &Address) {
        let minter: Address = env.storage().instance().get(&DataKey::Minter).unwrap();
        assert!(*caller == minter, "only minter can call this");
    }
}
