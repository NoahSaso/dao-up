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

    const USER: &str = "USER";
    const ADMIN: &str = "ADMIN";
    const DENOM: &str = "denom";

    fn mock_app() -> App {
        AppBuilder::new().build(|router, _, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(USER),
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
            receiver_address: USER.to_string(),
            fee: Decimal::percent(3),
            public_listing_fee: Coin {
                denom: DENOM.to_string(),
                amount: Uint128::from(500000u128),
            },
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

            let new_config = ConfigUpdate {
                receiver_address: Some(ADMIN.to_string()),
                fee: Some(Decimal::percent(5)),
                public_listing_fee: Some(Coin {
                    denom: DENOM.to_string(),
                    amount: Uint128::from(1000000u128),
                }),
            };

            // Update.
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
            // Ensure fields updated.
            assert_eq!(
                response.config.receiver_addr.to_string(),
                new_config.receiver_address.unwrap()
            );
            assert_eq!(response.config.fee, new_config.fee.unwrap());
            assert_eq!(
                response.config.public_listing_fee,
                new_config.public_listing_fee.unwrap()
            );
        }

        #[test]
        fn updated_unauthorized() {
            let (mut app, fee_manager_contract_addr) = proper_instantiate();

            let new_config = ConfigUpdate {
                receiver_address: Some(ADMIN.to_string()),
                fee: Some(Decimal::percent(5)),
                public_listing_fee: Some(Coin {
                    denom: DENOM.to_string(),
                    amount: Uint128::from(1000000u128),
                }),
            };

            // Attempt update.
            let err: ContractError = app
                .execute_contract(
                    // Send as USER instead of ADMIN.
                    Addr::unchecked(USER),
                    fee_manager_contract_addr.clone(),
                    &ExecuteMsg::Update {
                        config: new_config.clone(),
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
            // Ensure fields not updated.
            assert_ne!(
                response.config.receiver_addr.to_string(),
                new_config.receiver_address.unwrap()
            );
            assert_ne!(response.config.fee, new_config.fee.unwrap());
            assert_ne!(
                response.config.public_listing_fee,
                new_config.public_listing_fee.unwrap()
            );
        }
    }
}
