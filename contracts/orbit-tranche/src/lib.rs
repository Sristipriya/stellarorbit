#![no_std]
//! Orbit Tranche Contract
//! Splits Orbit Vault shares into Principal Tokens (PT) and Yield Tokens (YT).
//! 
//! PT: Can be redeemed for the exact `base_value` of shares that were deposited.
//! YT: Can be redeemed for the variable yield generated above the `base_value`.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Vault,
    ShareToken,
    PtToken,
    YtToken,
    BaseValue(Address), // user -> base_value (scaled)
}

#[soroban_sdk::contractclient(name = "TokenClient")]
pub trait TokenInterface {
    fn mint(env: Env, minter: Address, to: Address, amount: i128);
    fn burn(env: Env, minter: Address, from: Address, amount: i128);
    fn transfer(env: Env, from: Address, to: Address, amount: i128);
    fn balance(env: Env, id: Address) -> i128;
}

#[soroban_sdk::contractclient(name = "VaultClient")]
pub trait VaultInterface {
    fn preview_share_price(env: Env) -> i128; // returns scaled price (1e7)
}

#[contract]
pub struct OrbitTranche;

#[contractimpl]
impl OrbitTranche {
    pub fn __constructor(
        env: Env,
        vault: Address,
        share_token: Address,
        pt_token: Address,
        yt_token: Address,
    ) {
        env.storage().instance().set(&DataKey::Vault, &vault);
        env.storage().instance().set(&DataKey::ShareToken, &share_token);
        env.storage().instance().set(&DataKey::PtToken, &pt_token);
        env.storage().instance().set(&DataKey::YtToken, &yt_token);
    }

    /// Mint PT and YT by depositing Orbit Shares.
    pub fn mint(env: Env, from: Address, share_amount: i128) {
        from.require_auth();
        assert!(share_amount > 0, "amount must be positive");

        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();
        let pt_token: Address = env.storage().instance().get(&DataKey::PtToken).unwrap();
        let yt_token: Address = env.storage().instance().get(&DataKey::YtToken).unwrap();
        let vault: Address = env.storage().instance().get(&DataKey::Vault).unwrap();

        // 1. Transfer shares from user to this contract
        let token = TokenClient::new(&env, &share_token);
        token.transfer(&from, &env.current_contract_address(), &share_amount);

        // 2. Mint 1 PT and 1 YT for each share
        let pt_client = TokenClient::new(&env, &pt_token);
        pt_client.mint(&env.current_contract_address(), &from, &share_amount);

        let yt_client = TokenClient::new(&env, &yt_token);
        yt_client.mint(&env.current_contract_address(), &from, &share_amount);

        // 3. Record base value
        let current_price = VaultClient::new(&env, &vault).preview_share_price();
        let key = DataKey::BaseValue(from.clone());
        let mut base_value: i128 = env.storage().instance().get(&key).unwrap_or(0);
        
        // base_value stores the total nominal XLM value of their deposited shares at time of mint
        let deposit_value = (share_amount * current_price) / 10_000_000;
        base_value += deposit_value;
        env.storage().instance().set(&key, &base_value);

        env.events().publish((symbol_short!("Mint"),), (from, share_amount, current_price));
    }

    /// Redeem PT for the base value (the exact XLM value deposited).
    /// Does not claim yield.
    pub fn redeem_pt(env: Env, from: Address, pt_amount: i128) {
        from.require_auth();
        
        let pt_token: Address = env.storage().instance().get(&DataKey::PtToken).unwrap();
        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();
        let vault: Address = env.storage().instance().get(&DataKey::Vault).unwrap();

        // 1. Burn PT
        let pt_client = TokenClient::new(&env, &pt_token);
        pt_client.burn(&env.current_contract_address(), &from, &pt_amount);

        // 2. Compute shares to return based on current price
        let current_price = VaultClient::new(&env, &vault).preview_share_price();
        let key = DataKey::BaseValue(from.clone());
        let mut base_value: i128 = env.storage().instance().get(&key).unwrap_or(0);

        // Calculate proportional base value being redeemed
        let total_pt = pt_client.balance(&from) + pt_amount; // before burn
        let redeemed_base_value = (base_value * pt_amount) / total_pt;
        base_value -= redeemed_base_value;
        env.storage().instance().set(&key, &base_value);

        // Convert base value back to shares at current price
        // (Since price goes up, this will return fewer shares than originally deposited,
        //  but the exact same XLM value as initially deposited)
        let shares_to_return = (redeemed_base_value * 10_000_000) / current_price;

        let token = TokenClient::new(&env, &share_token);
        token.transfer(&env.current_contract_address(), &from, &shares_to_return);

        env.events().publish((symbol_short!("RedeemPT"),), (from, pt_amount, shares_to_return));
    }

    /// Claim yield using YT.
    pub fn claim_yield(env: Env, from: Address, yt_amount: i128) {
        from.require_auth();

        let yt_token: Address = env.storage().instance().get(&DataKey::YtToken).unwrap();
        let share_token: Address = env.storage().instance().get(&DataKey::ShareToken).unwrap();
        let vault: Address = env.storage().instance().get(&DataKey::Vault).unwrap();

        // 1. Burn YT
        let yt_client = TokenClient::new(&env, &yt_token);
        yt_client.burn(&env.current_contract_address(), &from, &yt_amount);

        // 2. Compute Yield
        let current_price = VaultClient::new(&env, &vault).preview_share_price();
        let key = DataKey::BaseValue(from.clone());
        let base_value: i128 = env.storage().instance().get(&key).unwrap_or(0);

        let total_yt = yt_client.balance(&from) + yt_amount; // before burn
        
        // Total current value of original position (using yt_amount as proxy for original shares)
        let current_value = (yt_amount * current_price) / 10_000_000;
        
        // Base value allocated to these YTs
        let allocated_base = (base_value * yt_amount) / total_yt;

        assert!(current_value >= allocated_base, "no yield generated yet");
        let yield_value = current_value - allocated_base;

        // Convert yield value back to shares
        let shares_to_return = (yield_value * 10_000_000) / current_price;

        let token = TokenClient::new(&env, &share_token);
        if shares_to_return > 0 {
            token.transfer(&env.current_contract_address(), &from, &shares_to_return);
        }

        env.events().publish((symbol_short!("ClaimYT"),), (from, yt_amount, shares_to_return));
    }
}
