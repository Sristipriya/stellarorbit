#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Vault(String), // Maps Asset Symbol (String) -> Vault Contract Address
    VaultsList,    // Vec<String> to iterate over available vaults
}

#[contract]
pub struct VaultRegistry;

#[contractimpl]
impl VaultRegistry {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VaultsList, &Vec::<String>::new(&env));
    }

    pub fn set_vault(env: Env, admin: Address, symbol: String, vault: Address) {
        admin.require_auth();
        let current_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == current_admin, "not admin");

        let key = DataKey::Vault(symbol.clone());
        env.storage().instance().set(&key, &vault);

        let mut list: Vec<String> = env.storage().instance().get(&DataKey::VaultsList).unwrap();
        if !list.contains(&symbol) {
            list.push_back(symbol);
            env.storage().instance().set(&DataKey::VaultsList, &list);
        }
    }

    pub fn get_vault(env: Env, symbol: String) -> Address {
        let key = DataKey::Vault(symbol);
        env.storage().instance().get(&key).unwrap()
    }

    pub fn get_all_vaults(env: Env) -> Vec<String> {
        env.storage().instance().get(&DataKey::VaultsList).unwrap()
    }
}
