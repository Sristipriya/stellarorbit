#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, contractclient};

#[contractclient(name = "VaultClient")]
pub trait VaultInterface {
    fn deposit(env: Env, from: Address, amount: i128) -> i128;
}

#[contractclient(name = "PointsClient")]
pub trait PointsInterface {
    fn add_points(env: Env, caller: Address, user: Address, amount: i128);
}

#[contractclient(name = "TokenClient")]
pub trait TokenInterface {
    fn transfer(env: Env, from: Address, to: Address, amount: i128);
}

#[contract]
pub struct OrbitZapRouter;

#[contractimpl]
impl OrbitZapRouter {
    /// Simulates a DEX swap and deposits into the vault.
    pub fn zap_deposit(
        env: Env,
        user: Address,
        input_token: Address,
        amount: i128,
        vault: Address,
        share_token: Address,
        points_contract: Address,
    ) -> i128 {
        user.require_auth();

        // 1. Take input token from user (acts as the mock swap payment)
        let input_client = TokenClient::new(&env, &input_token);
        input_client.transfer(&user, &env.current_contract_address(), &amount);

        // 2. Mock Swap: We pretend 1:1 exchange rate for the demo.
        // The router must be pre-funded with the vault's native asset by the admin.
        let out_amount = amount;

        // 3. Deposit into vault on behalf of the router.
        // The vault will pull the native asset from the router's balance.
        let vault_client = VaultClient::new(&env, &vault);
        let shares = vault_client.deposit(&env.current_contract_address(), &out_amount);

        // 4. Transfer the received vault shares to the user.
        let share_client = TokenClient::new(&env, &share_token);
        share_client.transfer(&env.current_contract_address(), &user, &shares);

        // 5. Award Points to the user (1 point per 10,000,000 stroops = 1 point per full token)
        let points = amount / 10_000_000;
        if points > 0 {
            let points_client = PointsClient::new(&env, &points_contract);
            points_client.add_points(&env.current_contract_address(), &user, &points);
        }

        shares
    }
}
