#[cfg(test)]
mod tests {
    use crate::msg::InstantiateMsg;
    use cosmwasm_std::{Addr, Coin, Decimal, Empty, Uint128};
    use cw_multi_test::{App, AppBuilder, Contract, ContractWrapper, Executor};

    pub fn fee_manager_contract() -> Box<dyn Contract<Empty>> {
        let contract = ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        );
        Box::new(contract)
    }

    const USER1: &str = "USER1";
    const USER2: &str = "USER2";
    const ADMIN: &str = "ADMIN";
    const DENOM: &str = "denom";

    fn mock_app() -> App {
        AppBuilder::new().build(|router, _, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(USER1),
                    vec![Coin {
                        denom: DENOM.to_string(),
                        amount: Uint128::new(1),
                    }],
                )
                .unwrap();
        })
    }

    fn proper_instantiate() -> (App, Addr) {
        let mut app = mock_app();
        let fee_manager_id = app.store_code(fee_manager_contract());

        let msg = InstantiateMsg {
            fee: Decimal::percent(3),
            fee_receiver: USER1.to_string(),
            public_listing_fee: Coin {
                denom: DENOM.to_string(),
                amount: Uint128::from(500000u128),
            },
            public_listing_fee_receiver: USER2.to_string(),
        };
        let fee_manager_contract_addr = app
            .instantiate_contract(
                fee_manager_id,
                Addr::unchecked(ADMIN),
                &msg,
                &[],
                "test",
                None,
            )
            .unwrap();

        (app, fee_manager_contract_addr)
    }

    mod update {
        use super::*;
        use crate::{
            msg::{ConfigResponse, ConfigUpdate, ExecuteMsg, QueryMsg},
            ContractError,
        };

        #[test]
        fn update_allowed() {
            let (mut app, fee_manager_contract_addr) = proper_instantiate();

            // Update.
            let new_config = ConfigUpdate {
                fee: Some(Decimal::percent(5)),
                fee_receiver: Some(ADMIN.to_string()),
                public_listing_fee: Some(Coin {
                    denom: DENOM.to_string(),
                    amount: Uint128::from(1000000u128),
                }),
                public_listing_fee_receiver: Some(ADMIN.to_string()),
            };

            app.execute_contract(
                Addr::unchecked(ADMIN),
                fee_manager_contract_addr.clone(),
                &ExecuteMsg::Update {
                    config: new_config.clone(),
                },
                &[],
            )
            .unwrap();

            // Get config.
            let response: ConfigResponse = app
                .wrap()
                .query_wasm_smart(fee_manager_contract_addr.clone(), &QueryMsg::GetConfig {})
                .unwrap();
            let current_config = response.config;

            // Ensure fields updated.
            assert_eq!(current_config.fee, new_config.fee.unwrap());
            assert_eq!(
                current_config.fee_receiver.to_string(),
                new_config.fee_receiver.unwrap()
            );
            assert_eq!(
                current_config.public_listing_fee,
                new_config.public_listing_fee.unwrap()
            );
            assert_eq!(
                current_config.public_listing_fee_receiver.to_string(),
                new_config.public_listing_fee_receiver.unwrap()
            );
        }

        #[test]
        fn updated_unauthorized() {
            let (mut app, fee_manager_contract_addr) = proper_instantiate();

            // Get current config for comparison at the end.
            let response: ConfigResponse = app
                .wrap()
                .query_wasm_smart(fee_manager_contract_addr.clone(), &QueryMsg::GetConfig {})
                .unwrap();
            let old_config = response.config;

            // Attempt update.
            let err: ContractError = app
                .execute_contract(
                    // Send as USER1 instead of ADMIN.
                    Addr::unchecked(USER1),
                    fee_manager_contract_addr.clone(),
                    &ExecuteMsg::Update {
                        config: ConfigUpdate {
                            fee: Some(Decimal::percent(5)),
                            fee_receiver: Some(ADMIN.to_string()),
                            public_listing_fee: Some(Coin {
                                denom: DENOM.to_string(),
                                amount: Uint128::from(1000000u128),
                            }),
                            public_listing_fee_receiver: Some(ADMIN.to_string()),
                        },
                    },
                    &[],
                )
                .unwrap_err()
                .downcast()
                .unwrap();
            // Expect unauthorized.
            assert_eq!(err, ContractError::Unauthorized {});

            // Get config.
            let response: ConfigResponse = app
                .wrap()
                .query_wasm_smart(fee_manager_contract_addr.clone(), &QueryMsg::GetConfig {})
                .unwrap();
            let current_config = response.config;

            // Ensure fields stayed the same.
            assert_eq!(current_config.fee, old_config.fee);
            assert_eq!(
                current_config.fee_receiver.to_string(),
                old_config.fee_receiver.to_string()
            );
            assert_eq!(
                current_config.public_listing_fee,
                old_config.public_listing_fee
            );
            assert_eq!(
                current_config.public_listing_fee_receiver.to_string(),
                old_config.public_listing_fee_receiver.to_string()
            );
        }
    }
}
