
#![no_std]
extern crate alloc;
use soroban_sdk::{Env, Address, IntoVal, Symbol};
use soroban_sdk::auth::{InvokerContractAuthEntry, SubContractInvocation, ContractContext};

pub fn test_auth(env: Env, share_token: Address, from: Address, share_amount: i128) {
    env.authorize_as_current_contract(
        alloc::vec![
            InvokerContractAuthEntry::Contract(
                SubContractInvocation {
                    context: ContractContext {
                        contract: share_token.clone(),
                        fn_name: Symbol::new(&env, "transfer_from"),
                        args: (
                            env.current_contract_address(),
                            from.clone(),
                            env.current_contract_address(),
                            share_amount,
                        ).into_val(&env),
                    },
                    sub_invocations: soroban_sdk::vec![&env],
                }
            )
        ]
    );
}
