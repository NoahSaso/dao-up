use cosmwasm_std::{to_binary, Addr, Coin, Empty, Uint128};
use cw20::Cw20Coin;
use cw20::{BalanceResponse, Cw20ExecuteMsg};
use cw20_updatable_minter::state::MinterData;
use cw_multi_test::{App, Contract, ContractWrapper, Executor};

use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Campaign, DaoConfig};

const CREATOR_ADDR: &str = "creator";
const CHAIN_DENOM: &str = "ujuno";

fn cw20_mutable_minter_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        cw20_updatable_minter::contract::execute,
        cw20_updatable_minter::contract::instantiate,
        cw20_updatable_minter::contract::query,
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
        gov_token_code_id: cw20_id,
        campaign_info: Campaign {
            name: "Bong DAO".to_string(),
            description: "A DAO raising money to buy a bong.".to_string(),
            website: None,
            twitter: None,
            discord: None,
            image_url: Some("https://moonphase.is/image.svg".to_string()),
            dao_config: DaoConfig {
                token_name: "Bong DAO".to_string(),
                token_symbol: "BDAO".to_string(),
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

fn get_balance(app: &mut App, gov_token: &Addr) -> Uint128 {
    let balance: BalanceResponse = app
        .wrap()
        .query_wasm_smart(
            gov_token,
            &cw20::Cw20QueryMsg::Balance {
                address: CREATOR_ADDR.to_string(),
            },
        )
        .unwrap();

    balance.balance
}

fn purchase_and_get_balance(app: &mut App, escrow_addr: &Addr, amount: Uint128) -> Uint128 {
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: amount,
        }],
    )
    .unwrap();

    let gov_token: Addr = app
        .wrap()
        .query_wasm_smart(escrow_addr, &QueryMsg::GovToken {})
        .unwrap();

    get_balance(app, &gov_token)
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

    let balance = purchase_and_get_balance(&mut app, &escrow_addr, Uint128::from(1_000_000 as u64));

    assert_eq!(balance, Uint128::from(1 as u64))
}

#[test]
fn test_fractional_token_purchase() {
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

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1000 as u64));

    // Balance ought to round down so you can't get extra tokens by
    // paying weird amounts.
    let balance = purchase_and_get_balance(&mut app, &escrow_addr, Uint128::from(1900 as u64));
    assert_eq!(balance, Uint128::from(1 as u64));

    let balance = purchase_and_get_balance(&mut app, &escrow_addr, Uint128::from(1901 as u64));
    assert_eq!(balance, Uint128::from(2 as u64));

    let balance = purchase_and_get_balance(&mut app, &escrow_addr, Uint128::from(1010 as u64));
    assert_eq!(balance, Uint128::from(3 as u64));

    let balance = purchase_and_get_balance(&mut app, &escrow_addr, Uint128::from(1999 as u64));
    assert_eq!(balance, Uint128::from(4 as u64));
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

    let escrow_addr = setup_test_case(&mut app, Uint128::from(1_000 as u64));

    let balance =
        purchase_and_get_balance(&mut app, &escrow_addr, Uint128::from(100_000_000 as u64));
    assert_eq!(balance, Uint128::from(100_000 as u64));

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

    let balance =
        purchase_and_get_balance(&mut app, &escrow_addr, Uint128::from(25_000_000 as u64));
    assert_eq!(balance, Uint128::from(75_000 as u64));

    let balance = app
        .wrap()
        .query_balance(Addr::unchecked(CREATOR_ADDR), CHAIN_DENOM)
        .unwrap();
    assert_eq!(balance.amount, Uint128::from(925_000_000 as u64));

    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        gov_token.clone(),
        &Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: Uint128::from(75_000 as u64),
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

    let balance = get_balance(&mut app, &gov_token);
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
