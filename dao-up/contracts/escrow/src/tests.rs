use cosmwasm_std::{to_binary, Addr, Coin, Decimal, Empty, Uint128};
use cw20::Cw20Coin;
use cw20::{BalanceResponse, Cw20ExecuteMsg};
use cw20_updatable_minter::state::MinterData;
use cw3_dao::query::ConfigResponse;
use cw_multi_test::{App, Contract, ContractWrapper, Executor};
use cw_utils::Duration;

use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, StatusResponse};
use crate::state::{Campaign, DaoConfig, Status};

const CREATOR_ADDR: &str = "creator";
const BACKER_ADDR: &str = "backer";
const CHAIN_DENOM: &str = "ujuno";

fn cw20_mutable_minter_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        cw20_updatable_minter::contract::execute,
        cw20_updatable_minter::contract::instantiate,
        cw20_updatable_minter::contract::query,
    );
    Box::new(contract)
}

fn dao_dao_dao_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        cw3_dao::contract::execute,
        cw3_dao::contract::instantiate,
        cw3_dao::contract::query,
    )
    .with_reply(cw3_dao::contract::reply);
    Box::new(contract)
}

fn stake_cw20_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        stake_cw20::contract::execute,
        stake_cw20::contract::instantiate,
        stake_cw20::contract::query,
    );
    Box::new(contract)
}

fn escrow_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        crate::contract::execute,
        crate::contract::instantiate,
        crate::contract::query,
    )
    .with_reply(crate::contract::reply);
    Box::new(contract)
}

fn setup_test_case(app: &mut App, token_price: Uint128) -> Addr {
    let cw20_id = app.store_code(cw20_mutable_minter_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_cw20_id = app.store_code(stake_cw20_contract());

    let escrow_id = app.store_code(escrow_contract());

    let instantiate = InstantiateMsg {
        funding_goal: Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(100_000_000 as u64),
        },
        token_price: Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: token_price,
        },
        initial_balances: vec![],
        dao_initial_balance: Uint128::zero(),
        gov_token_code_id: cw20_id,
        dao_contract_code_id: dao_id,
        staking_contract_code_id: stake_cw20_id,
        campaign_info: Campaign {
            name: "Bong DAO".to_string(),
            description: "A DAO raising money to buy a bong.".to_string(),
            website: None,
            twitter: None,
            discord: None,
            image_url: Some("https://moonphase.is/image.svg".to_string()),
            visible: true,
            dao_config: DaoConfig {
                token_name: "Bong DAO".to_string(),
                token_symbol: "BDAO".to_string(),
                name: "Bong DAO".to_string(),
                description: "Some friends who own a bong".to_string(),
                threshold: cw3_dao::msg::Threshold::AbsolutePercentage {
                    percentage: Decimal::percent(75),
                },
                max_voting_period: Duration::Height(10),
                proposal_deposit_amount: Uint128::zero(),
                refund_failed_proposals: Some(true),
                unstaking_duration: None,
                image_url: None,
            },
        },
    };

    app.instantiate_contract(
        escrow_id,
        Addr::unchecked(CREATOR_ADDR),
        &instantiate,
        &[],
        "Bong DAO escrow",
        None,
    )
    .unwrap()
}

fn get_balance(app: &mut App, gov_token: &Addr, address: &Addr) -> Uint128 {
    let balance: BalanceResponse = app
        .wrap()
        .query_wasm_smart(
            gov_token,
            &cw20::Cw20QueryMsg::Balance {
                address: address.to_string(),
            },
        )
        .unwrap();

    balance.balance
}

fn purchase_and_get_balance(
    app: &mut App,
    escrow_addr: &Addr,
    sender: &Addr,
    amount: Uint128,
) -> Uint128 {
    app.execute_contract(
        sender.clone(),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount,
        }],
    )
    .unwrap();

    let gov_token: Addr = app
        .wrap()
        .query_wasm_smart(escrow_addr, &QueryMsg::GovToken {})
        .unwrap();

    get_balance(app, &gov_token, sender)
}

#[test]
fn test_cw20_birth() {
    let mut app = App::default();

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1_000_000 as u64));

    let gov_token: Addr = app
        .wrap()
        .query_wasm_smart(&escrow_addr, &QueryMsg::GovToken {})
        .unwrap();

    let minter: MinterData = app
        .wrap()
        .query_wasm_smart(&gov_token, &cw20_updatable_minter::msg::QueryMsg::Minter {})
        .unwrap();

    assert_eq!(minter.minter, escrow_addr);
    assert_eq!(minter.cap, None);
}

#[test]
fn test_simple_fund() {
    let mut app = App::new(|router, _, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(CREATOR_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
    });

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1_000_000 as u64));

    let balance = purchase_and_get_balance(
        &mut app,
        &escrow_addr,
        &Addr::unchecked(CREATOR_ADDR),
        Uint128::from(1_000_000 as u64),
    );

    assert_eq!(balance, Uint128::from(1_000_000_000_000 as u128))
}

#[test]
fn test_interesting_token_purchase() {
    let mut app = App::new(|router, _, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(CREATOR_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
    });

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1 as u64));

    let balance = purchase_and_get_balance(
        &mut app,
        &escrow_addr,
        &Addr::unchecked(CREATOR_ADDR),
        Uint128::from(1901 as u64),
    );
    assert_eq!(balance, Uint128::from(1901 as u64));

    let balance = purchase_and_get_balance(
        &mut app,
        &escrow_addr,
        &Addr::unchecked(CREATOR_ADDR),
        Uint128::from(1 as u64),
    );
    assert_eq!(balance, Uint128::from(1902 as u64));

    let balance = purchase_and_get_balance(
        &mut app,
        &escrow_addr,
        &Addr::unchecked(CREATOR_ADDR),
        Uint128::from(18 as u64),
    );
    assert_eq!(balance, Uint128::from(1920 as u64));
}

#[test]
fn test_simple_refund() {
    let mut app = App::new(|router, _, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(CREATOR_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
    });

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1 as u64));

    let balance = purchase_and_get_balance(
        &mut app,
        &escrow_addr,
        &Addr::unchecked(CREATOR_ADDR),
        Uint128::from(100_000_000 as u64),
    );
    assert_eq!(balance, Uint128::from(100_000_000 as u64));

    let gov_token: Addr = app
        .wrap()
        .query_wasm_smart(&escrow_addr, &QueryMsg::GovToken {})
        .unwrap();

    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        gov_token.clone(),
        &Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: Uint128::from(50_000 as u64),
            msg: to_binary("hello").unwrap(),
        },
        &[],
    )
    .unwrap();

    let balance = purchase_and_get_balance(
        &mut app,
        &escrow_addr,
        &Addr::unchecked(CREATOR_ADDR),
        Uint128::from(25_000 as u64),
    );
    assert_eq!(balance, Uint128::from(99_975_000 as u64));

    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        gov_token.clone(),
        &Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: Uint128::from(99_975_000 as u64),
            msg: to_binary("hello").unwrap(),
        },
        &[],
    )
    .unwrap();

    let balance = app
        .wrap()
        .query_balance(Addr::unchecked(CREATOR_ADDR), CHAIN_DENOM)
        .unwrap();
    assert_eq!(balance.amount, Uint128::from(1_000_000_000 as u64));

    let gov_token: Addr = app
        .wrap()
        .query_wasm_smart(escrow_addr, &QueryMsg::GovToken {})
        .unwrap();

    let balance = get_balance(&mut app, &gov_token, &Addr::unchecked(CREATOR_ADDR));
    assert_eq!(balance, Uint128::zero())
}

#[test]
fn test_no_refund_for_non_gov_token() {
    let mut app = App::new(|router, _, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(CREATOR_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
    });

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1_000 as u64));

    let cw20_id = app.store_code(cw20_mutable_minter_contract());
    let evil = app
        .instantiate_contract(
            cw20_id,
            Addr::unchecked(CREATOR_ADDR),
            &cw20_updatable_minter::msg::InstantiateMsg {
                name: "evil token".to_string(),
                symbol: "EVIL".to_string(),
                decimals: 7,
                initial_balances: vec![Cw20Coin {
                    address: CREATOR_ADDR.to_string(),
                    amount: Uint128::from(1 as u64),
                }],
                mint: None,
                marketing: None,
            },
            &[],
            "Bong DAO escrow",
            None,
        )
        .unwrap();

    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        evil,
        &Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: Uint128::from(1 as u64),
            msg: to_binary("hello").unwrap(),
        },
        &[],
    )
    .unwrap_err();
}

#[test]
fn test_campaign_close() {
    let mut app = App::new(|router, _, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(CREATOR_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(BACKER_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
    });

    let escrow_addr = setup_test_case(&mut app, Uint128::from(2 as u64));

    // Creator sends some tokens.
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(50_000_000 as u64),
        }],
    )
    .unwrap();

    // Creator tries to close the campaign and fails because the
    // funding goal is not reached.
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Close {},
        &[],
    )
    .unwrap_err();

    // Backer also sends some tokens causing the goal to be met exactly.
    app.execute_contract(
        Addr::unchecked(BACKER_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(50_000_000 as u64),
        }],
    )
    .unwrap();

    // Backer tries to close the campaign and fails.
    app.execute_contract(
        Addr::unchecked(BACKER_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Close {},
        &[],
    )
    .unwrap_err();

    // Creator closes the contract.
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Close {},
        &[],
    )
    .unwrap();

    // Make sure status is updated
    let status: StatusResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::Status {})
        .unwrap();
    assert!(matches!(
        status.status,
        Status::ClosedButNotTransferred { dao_address: _ }
    ));

    let dao_addr = match status.status {
        Status::ClosedButNotTransferred { dao_address } => dao_address,
        _ => panic!("Escrow has invalid status: {:?}", status.status),
    };

    let escrow_gov_addr: Addr = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::GovToken {})
        .unwrap();

    let dao_config: ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();

    assert_eq!(dao_config.gov_token, escrow_gov_addr);

    // Information leaking from default setup here in a not great
    // way. See `setup_test_case` for where these are coming from.
    assert_eq!(dao_config.config.name, "Bong DAO".to_string());
    assert_eq!(
        dao_config.config.description,
        "Some friends who own a bong".to_string()
    );
    assert_eq!(
        dao_config.config.threshold,
        cw3_dao::msg::Threshold::AbsolutePercentage {
            percentage: Decimal::percent(75)
        }
    );

    let token_config: cw20::TokenInfoResponse = app
        .wrap()
        .query_wasm_smart(
            dao_config.gov_token.clone(),
            &cw20::Cw20QueryMsg::TokenInfo {},
        )
        .unwrap();

    assert_eq!(token_config.name, "Bong DAO".to_string());
    assert_eq!(token_config.symbol, "BDAO".to_string());
    assert_eq!(token_config.decimals, 6);

    let minter_info: cw20::MinterResponse = app
        .wrap()
        .query_wasm_smart(dao_config.gov_token.clone(), &cw20::Cw20QueryMsg::Minter {})
        .unwrap();
    // Escrow contract should retain minting control until the
    // transfer method is executed.
    assert_eq!(minter_info.minter, escrow_addr.to_string());

    // Verify that balances are what we expect.
    let creator_balance = get_balance(
        &mut app,
        &dao_config.gov_token,
        &Addr::unchecked(CREATOR_ADDR),
    );
    let backer_balance = get_balance(
        &mut app,
        &dao_config.gov_token,
        &Addr::unchecked(BACKER_ADDR),
    );

    assert_eq!(creator_balance, Uint128::from(100_000_000 as u64));
    assert_eq!(backer_balance, Uint128::from(100_000_000 as u64));

    // Sending more tokens should fail.
    app.execute_contract(
        Addr::unchecked(BACKER_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(50_000_000 as u64),
        }],
    )
    .unwrap_err();

    // Refunding tokens should fail
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_config.gov_token.clone(),
        &Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: Uint128::from(25_000 as u64),
            msg: to_binary("hello").unwrap(),
        },
        &[],
    )
    .unwrap_err();
}

#[test]
fn test_full_campaign() {
    let mut app = App::new(|router, _, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(CREATOR_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(BACKER_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
    });

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1 as u64));

    // Creator sends some tokens.
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(50_000_000 as u64),
        }],
    )
    .unwrap();

    // Backer also sends some tokens causing the goal to be met exactly.
    app.execute_contract(
        Addr::unchecked(BACKER_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(50_000_000 as u64),
        }],
    )
    .unwrap();

    // Creator closes the contract.
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Close {},
        &[],
    )
    .unwrap();

    // Verify that the escrow still has the funds.
    let escrow_balance = app.wrap().query_balance(&escrow_addr, CHAIN_DENOM).unwrap();
    assert_eq!(escrow_balance.amount, Uint128::from(100_000_000 as u64));

    // Backer transfers the contract funds to the DAO.
    app.execute_contract(
        Addr::unchecked(BACKER_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Transfer {},
        &[],
    )
    .unwrap();

    // Make sure status is correct
    let status: StatusResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::Status {})
        .unwrap();
    assert!(matches!(status.status, Status::Closed { dao_address: _ }));

    let dao_addr = match status.status {
        Status::Closed { dao_address } => dao_address,
        _ => panic!("Escrow has invalid status: {:?}", status.status),
    };

    let dao_config: ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();

    let minter_info: cw20::MinterResponse = app
        .wrap()
        .query_wasm_smart(dao_config.gov_token.clone(), &cw20::Cw20QueryMsg::Minter {})
        .unwrap();
    // DAO contract should now have minting control.
    assert_eq!(minter_info.minter, dao_addr.to_string());

    // Verify that balances are what we expect.
    let creator_balance = get_balance(
        &mut app,
        &dao_config.gov_token,
        &Addr::unchecked(CREATOR_ADDR),
    );
    let backer_balance = get_balance(
        &mut app,
        &dao_config.gov_token,
        &Addr::unchecked(BACKER_ADDR),
    );

    assert_eq!(creator_balance, Uint128::from(50_000_000 as u64));
    assert_eq!(backer_balance, Uint128::from(50_000_000 as u64));

    let escrow_balance = app.wrap().query_balance(&escrow_addr, CHAIN_DENOM).unwrap();
    assert_eq!(escrow_balance.amount, Uint128::from(0 as u64));

    let dao_balance = app.wrap().query_balance(&dao_addr, CHAIN_DENOM).unwrap();
    assert_eq!(dao_balance.amount, Uint128::from(100_000_000 as u64));
}

#[test]
fn mega_test_o_death() {
    let addresses: Vec<_> = (0..1_000).map(|i| format!("backer_{}", i)).collect();
    let team: Vec<_> = (0..10).map(|i| format!("team_{}", i)).collect();

    // Sacrificial clones for lambda which wants to move.
    let team_for_lambda = team.clone();
    let addresses_for_lambda = addresses.clone();

    let mut app = App::new(|router, _, storage| {
        router
            .bank
            .init_balance(
                storage,
                &Addr::unchecked(CREATOR_ADDR),
                vec![Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1_000_000_000 as u64),
                }],
            )
            .unwrap();
        for addr in team_for_lambda {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(addr),
                    vec![Coin {
                        denom: CHAIN_DENOM.to_string(),
                        amount: Uint128::from(50_000_000 as u64),
                    }],
                )
                .unwrap();
        }
        for addr in addresses_for_lambda {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(addr),
                    vec![Coin {
                        denom: CHAIN_DENOM.to_string(),
                        amount: Uint128::from(25_000_000 as u64),
                    }],
                )
                .unwrap();
        }
    });

    let cw20_id = app.store_code(cw20_mutable_minter_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_cw20_id = app.store_code(stake_cw20_contract());

    let escrow_id = app.store_code(escrow_contract());

    let funding_goal = Coin {
        denom: CHAIN_DENOM.to_string(),
        amount: Uint128::from(10_000_000 as u128),
    };

    let backer_supply = Uint128::from(10_000_000_000_000 as u128);

    let token_price = Coin {
        denom: CHAIN_DENOM.to_string(),
        amount: backer_supply / funding_goal.amount, // token / uJuno
    };

    let instantiate = InstantiateMsg {
        funding_goal: funding_goal.clone(),
        token_price: token_price.clone(),
        initial_balances: team
            .iter()
            .map(|addr| Cw20Coin {
                address: addr.to_string(),
                amount: Uint128::from(5_000_000 as u128),
            })
            .collect(),
        dao_initial_balance: Uint128::from(90_000_000_000_000 as u128),
        gov_token_code_id: cw20_id,
        dao_contract_code_id: dao_id,
        staking_contract_code_id: stake_cw20_id,
        campaign_info: Campaign {
            name: "Bong DAO".to_string(),
            description: "A DAO raising money to buy a bong.".to_string(),
            website: None,
            twitter: None,
            discord: None,
            image_url: Some("https://moonphase.is/image.svg".to_string()),
            visible: true,
            dao_config: DaoConfig {
                token_name: "Bong DAO".to_string(),
                token_symbol: "BDAO".to_string(),
                name: "Bong DAO".to_string(),
                description: "Some friends who own a bong".to_string(),
                threshold: cw3_dao::msg::Threshold::AbsolutePercentage {
                    percentage: Decimal::percent(75),
                },
                max_voting_period: Duration::Height(10),
                proposal_deposit_amount: Uint128::zero(),
                refund_failed_proposals: Some(true),
                unstaking_duration: None,
                image_url: None,
            },
        },
    };

    let escrow_addr = app
        .instantiate_contract(
            escrow_id,
            Addr::unchecked(CREATOR_ADDR),
            &instantiate,
            &[],
            "Bong DAO escrow",
            None,
        )
        .unwrap();

    let gov_token: Addr = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::GovToken {})
        .unwrap();

    // Back this baddie..
    for address in addresses.iter() {
        app.execute_contract(
            Addr::unchecked(address),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: Uint128::from(10_000 as u64),
            }],
        )
        .unwrap();
    }

    // Backer 1 wonders if we round up and they can get some money by
    // sending a token amount worth less than 1uJuno.
    app.execute_contract(
        Addr::unchecked("backer_1"),
        gov_token.clone(),
        &Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: token_price.amount - Uint128::from(1 as u64),
            msg: to_binary("hello").unwrap(),
        },
        &[],
    )
    .unwrap_err(); // Backer 1 fails.

    // Paper hands.
    for (index, address) in addresses.iter().enumerate() {
        app.execute_contract(
            Addr::unchecked(address),
            gov_token.clone(),
            &Cw20ExecuteMsg::Send {
                contract: escrow_addr.to_string(),
                amount: Uint128::from((index + 1) as u64) * token_price.amount,
                msg: to_binary("hello").unwrap(),
            },
            &[],
        )
        .unwrap();
    }

    // But they return after the creator says something nice on
    // Twitter!
    for (index, address) in addresses.iter().enumerate() {
        app.execute_contract(
            Addr::unchecked(address),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: Uint128::from((index + 1) as u64),
            }],
        )
        .unwrap();
    }

    // Team also pitches in a little at the end because they're
    // feeling good. Funding goal is already met but more tokens can
    // still be minted.
    for address in team.iter() {
        app.execute_contract(
            Addr::unchecked(address),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: Uint128::from(1 as u64),
            }],
        )
        .unwrap();
    }

    // Creator closes the contract.
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Close {},
        &[],
    )
    .unwrap();

    // Backer 1 wonders if they can still get some tokens despite the
    // campaign being over.
    app.execute_contract(
        Addr::unchecked("backer_1"),
        gov_token.clone(),
        &Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: token_price.amount,
            msg: to_binary("hello").unwrap(),
        },
        &[],
    )
    .unwrap_err(); // Backer 1 fails.

    // Creators turn out to be evil! Refuse to transfer
    // funds. Luckily, anyone can execute the transfer. Backer 1 saves
    // the day.
    app.execute_contract(
        Addr::unchecked("backer_1"),
        escrow_addr.clone(),
        &ExecuteMsg::Transfer {},
        &[],
    )
    .unwrap();

    // Make sure status is correct.
    let status: StatusResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::Status {})
        .unwrap();
    assert!(matches!(status.status, Status::Closed { dao_address: _ }));

    let dao_addr = match status.status {
        Status::Closed { dao_address } => dao_address,
        _ => panic!("Escrow has invalid status: {:?}", status.status),
    };

    let dao_config: ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();

    let minter_info: cw20::MinterResponse = app
        .wrap()
        .query_wasm_smart(dao_config.gov_token.clone(), &cw20::Cw20QueryMsg::Minter {})
        .unwrap();
    // DAO contract should now have minting control.
    assert_eq!(minter_info.minter, dao_addr.to_string());

    // Verify that balances are what we expect.
    let creator_balance = get_balance(
        &mut app,
        &dao_config.gov_token,
        &Addr::unchecked(CREATOR_ADDR),
    );
    assert_eq!(creator_balance, Uint128::zero());

    let escrow_balance = app.wrap().query_balance(&escrow_addr, CHAIN_DENOM).unwrap();
    assert_eq!(escrow_balance.amount, Uint128::zero());

    let dao_balance = app.wrap().query_balance(&dao_addr, CHAIN_DENOM).unwrap();
    assert_eq!(
        dao_balance.amount,
        funding_goal.amount + Uint128::from(team.len() as u64)
    );

    for address in addresses.iter() {
        let balance = get_balance(&mut app, &dao_config.gov_token, &Addr::unchecked(address));
        assert_eq!(balance, Uint128::from(10_000 as u64) * token_price.amount);
    }

    for address in team.iter() {
        let balance = get_balance(&mut app, &dao_config.gov_token, &Addr::unchecked(address));
        // Team members have contribution + initial amount.
        assert_eq!(
            balance,
            token_price.amount + Uint128::from(5_000_000 as u128)
        );
    }

    let dao_token_balance = get_balance(&mut app, &dao_config.gov_token, &dao_addr);
    assert_eq!(Uint128::from(90_000_000_000_000 as u128), dao_token_balance);

    // Check the total supply to make sure that refunded tokens were
    // burned.
    let token_config: cw20::TokenInfoResponse = app
        .wrap()
        .query_wasm_smart(
            dao_config.gov_token.clone(),
            &cw20::Cw20QueryMsg::TokenInfo {},
        )
        .unwrap();
    let total_supply = token_config.total_supply;
    let expected_supply = Uint128::from(team.len() as u64)
        * (token_price.amount + Uint128::from(5_000_000 as u128))
        + Uint128::from(addresses.len() as u64)
            * (Uint128::from(10_000 as u64) * token_price.amount)
        + Uint128::from(90_000_000_000_000 as u128);

    assert_eq!(total_supply, expected_supply)
}
