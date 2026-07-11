#![cfg(test)]
use super::{OrbitVault, OrbitVaultClient};
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    token, Address, Env, IntoVal,
};

fn setup<'a>() -> (
    Env,
    Address,
    OrbitVaultClient<'a>,
    token::StellarAssetClient<'a>,
    token::TokenClient<'a>,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let asset_id = sac.address();
    let token_admin = token::StellarAssetClient::new(&env, &asset_id);
    let token_client = token::TokenClient::new(&env, &asset_id);

    let vault_id = env.register(OrbitVault, (asset_id.clone(), admin.clone()));
    let vault = OrbitVaultClient::new(&env, &vault_id);

    (
        env,
        vault_id,
        vault,
        token_admin,
        token_client,
        asset_id,
        admin,
    )
}

#[test]
fn first_deposit_mints_one_to_one_shares() {
    let (env, _vault_id, vault, token_admin, token_client, _asset, _) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &1_000_0000000); // 1000 XLM

    let shares = vault.deposit(&alice, &100_0000000);
    assert_eq!(shares, 100_0000000);
    assert_eq!(vault.balance_of(&alice), 100_0000000);
    assert_eq!(vault.total_assets(), 100_0000000);
    assert_eq!(vault.total_shares(), 100_0000000);
    assert_eq!(token_client.balance(&alice), 900_0000000);
}

#[test]
fn second_deposit_uses_share_ratio() {
    let (env, _vault_id, vault, token_admin, _t, _asset, _) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    token_admin.mint(&alice, &1_000_0000000);
    token_admin.mint(&bob, &1_000_0000000);

    vault.deposit(&alice, &100_0000000);
    let bob_shares = vault.deposit(&bob, &50_0000000);
    assert_eq!(bob_shares, 50_0000000);
}

#[test]
fn withdraw_returns_proportional_assets() {
    let (env, _vault_id, vault, token_admin, token_client, _asset, _) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &1_000_0000000);

    vault.deposit(&alice, &100_0000000);
    let out = vault.withdraw(&alice, &40_0000000);
    assert_eq!(out, 40_0000000);
    assert_eq!(vault.balance_of(&alice), 60_0000000);
    assert_eq!(token_client.balance(&alice), 940_0000000);
}

#[test]
#[should_panic(expected = "insufficient shares")]
fn cannot_withdraw_more_than_owned() {
    let (env, _vault_id, vault, token_admin, _t, _asset, _) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &1_000_0000000);
    vault.deposit(&alice, &10_0000000);
    vault.withdraw(&alice, &11_0000000);
}

#[test]
fn preview_share_price_is_unity_before_first_deposit() {
    let (_env, _id, vault, _a, _t, _asset, _) = setup();
    assert_eq!(vault.preview_share_price(), 10_000_000);
}

#[test]
fn harvest_increases_total_assets_and_share_price() {
    let (env, _, vault, token_admin, _, _, admin) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &100_0000000);
    vault.deposit(&alice, &100_0000000);

    token_admin.mint(&admin, &50_0000000);
    vault.harvest(&admin, &50_0000000);

    assert_eq!(vault.total_assets(), 150_0000000);
    assert_eq!(vault.preview_share_price(), 15_000_000); // 1.5 XLM per share
}

#[test]
fn invest_and_divest_updates_assets_lent() {
    let (env, _, vault, token_admin, _, _, admin) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &100_0000000);
    vault.deposit(&alice, &100_0000000);

    vault.invest(&admin, &60_0000000);
    assert_eq!(vault.assets_lent(), 60_0000000);

    // Total assets should still be 100
    assert_eq!(vault.total_assets(), 100_0000000);

    // Divest
    vault.divest(&admin, &20_0000000);
    assert_eq!(vault.assets_lent(), 40_0000000);
}

#[test]
#[should_panic(expected = "insufficient idle assets")]
fn cannot_withdraw_if_invested() {
    let (env, _, vault, token_admin, _, _, admin) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &100_0000000);
    vault.deposit(&alice, &100_0000000);

    vault.invest(&admin, &60_0000000);
    // Alice tries to withdraw 50, but only 40 is idle
    vault.withdraw(&alice, &50_0000000);
}
