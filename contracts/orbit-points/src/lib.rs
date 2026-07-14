#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Admin,
    Authorized(Address), // routers
    Points(Address),
    Referrer(Address),
}

#[contract]
pub struct OrbitPoints;

#[contractimpl]
impl OrbitPoints {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn set_authorized(env: Env, caller: Address, router: Address, authorized: bool) {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin {
            panic!("not admin");
        }
        env.storage().instance().set(&DataKey::Authorized(router), &authorized);
    }

    pub fn set_referrer(env: Env, user: Address, referrer: Address) {
        user.require_auth();
        if user == referrer {
            panic!("cannot refer self");
        }
        if env.storage().persistent().has(&DataKey::Referrer(user.clone())) {
            panic!("referrer already set");
        }
        env.storage().persistent().set(&DataKey::Referrer(user), &referrer);
    }

    pub fn get_referrer(env: Env, user: Address) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Referrer(user))
    }

    pub fn get_points(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Points(user)).unwrap_or(0)
    }

    pub fn add_points(env: Env, caller: Address, user: Address, amount: i128) {
        caller.require_auth();
        let is_auth: bool = env.storage().instance().get(&DataKey::Authorized(caller.clone())).unwrap_or(false);
        if !is_auth {
            panic!("not authorized");
        }

        let current_points = Self::get_points(env.clone(), user.clone());
        env.storage().persistent().set(&DataKey::Points(user.clone()), &(current_points + amount));

        if let Some(referrer) = Self::get_referrer(env.clone(), user) {
            let bonus = amount / 10; // 10% bonus
            if bonus > 0 {
                let ref_points = Self::get_points(env.clone(), referrer.clone());
                env.storage().persistent().set(&DataKey::Points(referrer), &(ref_points + bonus));
            }
        }
    }
}
