#![no_std]
//! Orbit Market Contract (P2P Lending)
//! Allows users to lend USDC in exchange for a fixed interest return, 
//! collateralized by Orbit PT or YT tokens.
//! If the borrower defaults, the lender claims the PT/YT collateral.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env,
};

#[derive(Clone)]
#[contracttype]
pub struct LoanOffer {
    pub lender: Address,
    pub usdc_amount: i128,
    pub interest_amount: i128,
    pub max_duration_ledgers: u32,
    pub required_collateral_token: Address,
    pub required_collateral_amount: i128,
    pub is_active: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct ActiveLoan {
    pub offer_id: u32,
    pub borrower: Address,
    pub expiry_ledger: u32,
    pub is_repaid: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    UsdcToken,
    OfferCount,
    Offer(u32),
    Loan(u32), // maps offer_id -> ActiveLoan
}

#[soroban_sdk::contractclient(name = "TokenClient")]
pub trait TokenInterface {
    fn transfer(from: Address, to: Address, amount: i128);
}

#[contract]
pub struct OrbitMarket;

#[contractimpl]
impl OrbitMarket {
    pub fn __constructor(env: Env, usdc_token: Address) {
        env.storage().instance().set(&DataKey::UsdcToken, &usdc_token);
        env.storage().instance().set(&DataKey::OfferCount, &0_u32);
    }

    /// Lender creates an offer to lend USDC.
    pub fn create_offer(
        env: Env,
        lender: Address,
        usdc_amount: i128,
        interest_amount: i128,
        max_duration_ledgers: u32,
        required_collateral_token: Address,
        required_collateral_amount: i128,
    ) -> u32 {
        lender.require_auth();
        assert!(usdc_amount > 0, "must lend positive amount");
        assert!(interest_amount >= 0, "interest cannot be negative");

        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        
        // Pull USDC from lender into escrow
        let client = TokenClient::new(&env, &usdc_token);
        client.transfer(&lender, &env.current_contract_address(), &usdc_amount);

        let mut count: u32 = env.storage().instance().get(&DataKey::OfferCount).unwrap();
        count += 1;

        let offer = LoanOffer {
            lender: lender.clone(),
            usdc_amount,
            interest_amount,
            max_duration_ledgers,
            required_collateral_token,
            required_collateral_amount,
            is_active: true,
        };

        env.storage().instance().set(&DataKey::Offer(count), &offer);
        env.storage().instance().set(&DataKey::OfferCount, &count);

        env.events().publish((symbol_short!("NewOffer"), count), (lender, usdc_amount));
        count
    }

    /// Borrower accepts an offer, locking their collateral and receiving USDC.
    pub fn borrow(env: Env, borrower: Address, offer_id: u32) {
        borrower.require_auth();

        let key = DataKey::Offer(offer_id);
        let mut offer: LoanOffer = env.storage().instance().get(&key).expect("offer not found");
        assert!(offer.is_active, "offer not active");

        // Lock collateral from borrower into escrow
        let col_client = TokenClient::new(&env, &offer.required_collateral_token);
        col_client.transfer(&borrower, &env.current_contract_address(), &offer.required_collateral_amount);

        // Send USDC to borrower
        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let usdc_client = TokenClient::new(&env, &usdc_token);
        usdc_client.transfer(&env.current_contract_address(), &borrower, &offer.usdc_amount);

        // Record active loan
        offer.is_active = false;
        env.storage().instance().set(&key, &offer);

        let loan = ActiveLoan {
            offer_id,
            borrower: borrower.clone(),
            expiry_ledger: env.ledger().sequence() + offer.max_duration_ledgers,
            is_repaid: false,
        };
        env.storage().instance().set(&DataKey::Loan(offer_id), &loan);

        env.events().publish((symbol_short!("Borrow"), offer_id), (borrower, offer.usdc_amount));
    }

    /// Borrower repays the loan (principal + interest) and unlocks collateral.
    pub fn repay(env: Env, borrower: Address, offer_id: u32) {
        borrower.require_auth();

        let loan_key = DataKey::Loan(offer_id);
        let mut loan: ActiveLoan = env.storage().instance().get(&loan_key).expect("loan not found");
        assert!(!loan.is_repaid, "already repaid");
        assert!(loan.borrower == borrower, "not the borrower");
        
        // Can optionally allow repayment even if expired, as long as liquidate hasn't been called.

        let offer_key = DataKey::Offer(offer_id);
        let offer: LoanOffer = env.storage().instance().get(&offer_key).unwrap();

        // Transfer USDC (principal + interest) from borrower to lender
        let total_due = offer.usdc_amount + offer.interest_amount;
        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let usdc_client = TokenClient::new(&env, &usdc_token);
        usdc_client.transfer(&borrower, &offer.lender, &total_due);

        // Return collateral to borrower
        let col_client = TokenClient::new(&env, &offer.required_collateral_token);
        col_client.transfer(&env.current_contract_address(), &borrower, &offer.required_collateral_amount);

        loan.is_repaid = true;
        env.storage().instance().set(&loan_key, &loan);

        env.events().publish((symbol_short!("Repay"), offer_id), (borrower, total_due));
    }

    /// Lender liquidates an expired, unpaid loan and claims the collateral.
    pub fn liquidate(env: Env, lender: Address, offer_id: u32) {
        lender.require_auth();

        let loan_key = DataKey::Loan(offer_id);
        let mut loan: ActiveLoan = env.storage().instance().get(&loan_key).expect("loan not found");
        assert!(!loan.is_repaid, "already repaid");
        assert!(env.ledger().sequence() >= loan.expiry_ledger, "not yet expired");

        let offer_key = DataKey::Offer(offer_id);
        let offer: LoanOffer = env.storage().instance().get(&offer_key).unwrap();
        assert!(offer.lender == lender, "not the lender");

        // Transfer collateral to lender
        let col_client = TokenClient::new(&env, &offer.required_collateral_token);
        col_client.transfer(&env.current_contract_address(), &lender, &offer.required_collateral_amount);

        loan.is_repaid = true; // Mark as resolved
        env.storage().instance().set(&loan_key, &loan);

        env.events().publish((symbol_short!("Liquidate"), offer_id), (lender, offer.required_collateral_amount));
    }
}
