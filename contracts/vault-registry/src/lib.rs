#![no_std]
//! Orbit VaultRegistry — single source of truth for all deployed Orbit vaults.
//!
//! State:
//!   - vaults: Map<Symbol, VaultEntry>   keyed by vault ID (e.g. "xlm", "usdc", "idx")
//!
//! Functions:
//!   - register(admin, id, entry) — register a new vault
//!   - get_vault(id)              — fetch a vault entry by ID
//!   - list_vaults()              — return all registered vaults
//!   - deregister(admin, id)      — remove a vault

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Symbol, Vec, vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Vaults,
}

/// Metadata stored per vault.
#[derive(Clone)]
#[contracttype]
pub struct VaultEntry {
    /// Contract address of the vault.
    pub contract_id: Address,
    /// Human-readable name, e.g. "Orbit XLM Vault".
    pub name: String,
    /// Asset ticker, e.g. "XLM", "USDC".
    pub asset_symbol: String,
    /// Stellar Asset Contract address for the underlying asset.
    pub asset_id: Address,
    /// Whether this vault is active.
    pub active: bool,
}

#[contract]
pub struct VaultRegistry;

#[contractimpl]
impl VaultRegistry {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Vaults, &Map::<Symbol, VaultEntry>::new(&env));
    }

    /// Register or update a vault entry.
    pub fn register(env: Env, admin: Address, id: Symbol, entry: VaultEntry) {
        admin.require_auth();
        Self::assert_admin(&env, &admin);
        let mut vaults: Map<Symbol, VaultEntry> = env
            .storage()
            .instance()
            .get(&DataKey::Vaults)
            .unwrap_or(Map::new(&env));
        vaults.set(id.clone(), entry.clone());
        env.storage().instance().set(&DataKey::Vaults, &vaults);
        env.events()
            .publish((symbol_short!("Reg"),), (id, entry.contract_id));
    }

    /// Deregister a vault.
    pub fn deregister(env: Env, admin: Address, id: Symbol) {
        admin.require_auth();
        Self::assert_admin(&env, &admin);
        let mut vaults: Map<Symbol, VaultEntry> = env
            .storage()
            .instance()
            .get(&DataKey::Vaults)
            .unwrap_or(Map::new(&env));
        vaults.remove(id.clone());
        env.storage().instance().set(&DataKey::Vaults, &vaults);
    }

    /// Fetch a specific vault by symbol key.
    pub fn get_vault(env: Env, id: Symbol) -> Option<VaultEntry> {
        let vaults: Map<Symbol, VaultEntry> = env
            .storage()
            .instance()
            .get(&DataKey::Vaults)
            .unwrap_or(Map::new(&env));
        vaults.get(id)
    }

    /// Return all registered vault entries as a Vec of (id, entry) tuples.
    pub fn list_vaults(env: Env) -> Vec<VaultEntry> {
        let vaults: Map<Symbol, VaultEntry> = env
            .storage()
            .instance()
            .get(&DataKey::Vaults)
            .unwrap_or(Map::new(&env));
        let mut result: Vec<VaultEntry> = Vec::new(&env);
        for key in vaults.keys() {
            if let Some(entry) = vaults.get(key) {
                result.push_back(entry);
            }
        }
        result
    }

    fn assert_admin(env: &Env, caller: &Address) {
        let stored: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(*caller == stored, "unauthorized");
    }
}
