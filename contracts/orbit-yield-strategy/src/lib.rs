#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    PendingYield,
    Admin,
}

#[contract]
pub struct YieldStrategy;

#[contractimpl]
impl YieldStrategy {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PendingYield, &0_i128);
    }

    /// Supply assets to the strategy.
    pub fn supply(env: Env, from: Address, reserve: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let client = token::Client::new(&env, &reserve);
        client.transfer(&from, &env.current_contract_address(), &amount);
    }

    /// Withdraw assets from the strategy.
    pub fn withdraw(env: Env, from: Address, reserve: Address, amount: i128, to: Address) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let client = token::Client::new(&env, &reserve);
        client.transfer(&env.current_contract_address(), &to, &amount);
    }

    /// Admin function to inject mock yield into the strategy.
    pub fn add_mock_yield(env: Env, admin: Address, reserve: Address, amount: i128) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "unauthorized");

        // Admin transfers yield into the strategy contract
        let client = token::Client::new(&env, &reserve);
        client.transfer(&admin, &env.current_contract_address(), &amount);

        // Record the pending yield
        let mut pending: i128 = env.storage().instance().get(&DataKey::PendingYield).unwrap_or(0);
        pending += amount;
        env.storage().instance().set(&DataKey::PendingYield, &pending);
    }

    /// Claims all accumulated yield. Can be called by anyone (usually the Vault or Keeper).
    /// Sends the yield to the specified `to` address.
    pub fn claim_yield(env: Env, reserve: Address, to: Address) -> i128 {
        // We don't require auth here because anyone can trigger the harvest.
        // The yield is simply sent to `to`. In a real system, we'd ensure `to` is the vault,
        // or the vault calls this and specifies itself.

        let pending: i128 = env.storage().instance().get(&DataKey::PendingYield).unwrap_or(0);
        
        if pending > 0 {
            let client = token::Client::new(&env, &reserve);
            client.transfer(&env.current_contract_address(), &to, &pending);
            env.storage().instance().set(&DataKey::PendingYield, &0_i128);
        }
        
        pending
    }
}
