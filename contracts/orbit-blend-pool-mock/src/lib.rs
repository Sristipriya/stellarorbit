#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, token};

#[contract]
pub struct BlendPoolMock;

#[contractimpl]
impl BlendPoolMock {
    /// Supply assets to the pool.
    pub fn supply(env: Env, from: Address, reserve: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let client = token::Client::new(&env, &reserve);
        client.transfer(&from, &env.current_contract_address(), &amount);
    }

    /// Withdraw assets from the pool.
    pub fn withdraw(env: Env, from: Address, reserve: Address, amount: i128, to: Address) {
        from.require_auth();
        assert!(amount > 0, "amount must be positive");
        let client = token::Client::new(&env, &reserve);
        client.transfer(&env.current_contract_address(), &to, &amount);
    }
}
