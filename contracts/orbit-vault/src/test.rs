#![cfg(test)]
use super::{OrbitVault, OrbitVaultClient};
use soroban_sdk::{
    testutils::Address as _,
    token, Address, Env, String,
};
use orbit_share_token::{OrbitShareToken, OrbitShareTokenClient};

fn setup<'a>() -> (
    Env,
    Address,
    OrbitVaultClient<'a>,
    token::StellarAssetClient<'a>,
    token::TokenClient<'a>,
    Address,
    Address,
    Address, // fee_recipient
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let asset_id = sac.address();
    let token_admin = token::StellarAssetClient::new(&env, &asset_id);
    let token_client = token::TokenClient::new(&env, &asset_id);

    let share_token_id = env.register(
        OrbitShareToken,
        (
            admin.clone(),
            admin.clone(),
            String::from_str(&env, "Orbit Share"),
            String::from_str(&env, "orXLM"),
            7_u32,
        ),
    );

    // Constructor: asset, admin, fee_recipient, perf_fee_bps, share_token
    let vault_id = env.register(
        OrbitVault,
        (
            asset_id.clone(),
            admin.clone(),
            fee_recipient.clone(),
            1000_u32,
            share_token_id.clone(),
        ),
    );
    let vault = OrbitVaultClient::new(&env, &vault_id);

    // Link minter to vault
    OrbitShareTokenClient::new(&env, &share_token_id).set_minter(&admin, &vault_id);

    (
        env,
        vault_id,
        vault,
        token_admin,
        token_client,
        asset_id,
        admin,
        fee_recipient,
    )
}

#[test]
fn first_deposit_mints_one_to_one_shares() {
    let (env, _vault_id, vault, token_admin, token_client, _asset, _, _fee) = setup();
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
    let (env, _vault_id, vault, token_admin, _t, _asset, _, _fee) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    token_admin.mint(&alice, &1_000_0000000);
    token_admin.mint(&bob, &1_000_0000000);

    vault.deposit(&alice, &100_0000000, &None);
    let bob_shares = vault.deposit(&bob, &50_0000000, &None);
    assert_eq!(bob_shares, 50_0000000);
}

#[test]
fn withdraw_returns_proportional_assets() {
    let (env, _vault_id, vault, token_admin, token_client, _asset, _, _fee) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &1_000_0000000);

    vault.deposit(&alice, &100_0000000, &None);
    let out = vault.withdraw(&alice, &40_0000000);
    assert_eq!(out, 40_0000000);
    assert_eq!(vault.balance_of(&alice), 60_0000000);
    assert_eq!(token_client.balance(&alice), 940_0000000);
}

#[test]
#[should_panic(expected = "insufficient shares")]
fn cannot_withdraw_more_than_owned() {
    let (env, _vault_id, vault, token_admin, _t, _asset, _, _fee) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &1_000_0000000);
    vault.deposit(&alice, &10_0000000, &None);
    vault.withdraw(&alice, &11_0000000);
}

#[test]
fn preview_share_price_is_unity_before_first_deposit() {
    let (_env, _id, vault, _a, _t, _asset, _, _fee) = setup();
    assert_eq!(vault.preview_share_price(), 10_000_000);
}

#[test]
fn harvest_increases_total_assets_and_share_price_with_fee() {
    let (env, _, vault, token_admin, token_client, _, admin, fee_recipient) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &100_0000000);
    vault.deposit(&alice, &100_0000000, &None);

    // Harvest 50 XLM gross. Fee is 10% = 5 XLM → net = 45 XLM to vault.
    token_admin.mint(&admin, &50_0000000);
    vault.harvest(&admin, &50_0000000);

    assert_eq!(vault.total_assets(), 145_0000000); // 100 + 45 net
    // price = 145/100 = 1.45 XLM per share scaled by 1e7
    assert_eq!(vault.preview_share_price(), 14_500_000);
    // Fee recipient received 5 XLM
    assert_eq!(token_client.balance(&fee_recipient), 5_0000000);
}

#[test]
fn harvest_records_price_snapshot() {
    let (env, _, vault, token_admin, _, _, admin, _fee) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &100_0000000);
    vault.deposit(&alice, &100_0000000, &None);

    token_admin.mint(&admin, &10_0000000);
    vault.harvest(&admin, &10_0000000);

    let history = vault.get_price_history();
    assert!(history.len() >= 1);
    let snap = history.get(0).unwrap();
    // price after harvest with 10% fee: (100 + 9) / 100 = 1.09 → 10_900_000
    assert_eq!(snap.price_scaled, 10_900_000);
}

#[test]
fn invest_and_divest_updates_assets_lent() {
    let (env, _, vault, token_admin, _, _, admin, _fee) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &100_0000000);
    vault.deposit(&alice, &100_0000000, &None);

    vault.invest(&admin, &60_0000000);
    assert_eq!(vault.assets_lent(), 60_0000000);
    assert_eq!(vault.total_assets(), 100_0000000);

    vault.divest(&admin, &20_0000000);
    assert_eq!(vault.assets_lent(), 40_0000000);
}

#[test]
#[should_panic(expected = "insufficient idle assets")]
fn cannot_withdraw_if_invested() {
    let (env, _, vault, token_admin, _, _, admin, _fee) = setup();
    let alice = Address::generate(&env);
    token_admin.mint(&alice, &100_0000000);
    vault.deposit(&alice, &100_0000000, &None);

    vault.invest(&admin, &60_0000000);
    // Alice tries to withdraw 50, but only 40 is idle
    vault.withdraw(&alice, &50_0000000);
}
