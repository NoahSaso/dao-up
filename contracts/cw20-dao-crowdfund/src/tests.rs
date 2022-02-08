use cosmwasm_std::{
    to_binary, Addr, BankMsg, Coin, CosmosMsg, Decimal, Empty, Fraction, Uint128, WasmMsg,
};
use cw20::Cw20Coin;
use cw3_dao::msg::GovTokenMsg;
use cw_multi_test::{next_block, App, Contract, ContractWrapper, Executor};
use cw_utils::Duration;

use crate::{
    msg::{DumpStateResponse, ExecuteMsg, InstantiateMsg, QueryMsg},
    state::{Campaign, Status},
    ContractError,
};

const CREATOR_ADDR: &str = "creator";
const DAO_UP_ADDR: &str = "daoup";
const CHAIN_DENOM: &str = "ujuno";

fn cw20_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        cw20_base::contract::execute,
        cw20_base::contract::instantiate,
        cw20_base::contract::query,
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

fn instantiate_dao(app: &mut App, dao_id: u64, cw20_id: u64, stake_id: u64) -> Addr {
    let instantiate = cw3_dao::msg::InstantiateMsg {
        name: "Bong DAO".to_string(),
        description: "A DAO that owns a bong for sharing with friends.".to_string(),
        gov_token: GovTokenMsg::InstantiateNewCw20 {
            cw20_code_id: cw20_id,
            stake_contract_code_id: stake_id,
            label: "Bong DAO token".to_string(),
            initial_dao_balance: Some(Uint128::from(100_000_000_000 as u64)),
            msg: cw3_dao::msg::GovTokenInstantiateMsg {
                name: "Bong DAO".to_string(),
                symbol: "BDAO".to_string(),
                decimals: 6,
                initial_balances: vec![Cw20Coin {
                    address: Addr::unchecked(CREATOR_ADDR).to_string(),
                    amount: Uint128::from(100_000_000 as u64),
                }],
                marketing: None,
            },
            unstaking_duration: None,
        },
        threshold: cw3_dao::msg::Threshold::AbsolutePercentage {
            percentage: Decimal::percent(75),
        },
        max_voting_period: Duration::Height(10),
        proposal_deposit_amount: Uint128::zero(),
        refund_failed_proposals: Some(true),
        image_url: None,
    };

    let dao_addr = app
        .instantiate_contract(
            dao_id,
            Addr::unchecked(CREATOR_ADDR),
            &instantiate,
            &[],
            "Bong DAO",
            None,
        )
        .unwrap();

    let config: cw3_dao::query::ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();

    let gov_token = config.gov_token;
    let staking_contract = config.staking_contract;

    // Stake the creators cokens.
    let stake_msg = cw20::Cw20ExecuteMsg::Send {
        contract: staking_contract.to_string(),
        amount: Uint128::from(100_000_000 as u64),
        msg: to_binary(&stake_cw20::msg::ReceiveMsg::Stake {}).unwrap(),
    };
    app.execute_contract(Addr::unchecked(CREATOR_ADDR), gov_token, &stake_msg, &[])
        .unwrap();
    // Move forward a block so the staked balance shows.
    app.update_block(next_block);

    dao_addr
}

fn instantiate_escrow(
    app: &mut App,
    dao_addr: Addr,
    escrow_id: u64,
    cw20_id: u64,
    funding_goal: u64,
) -> Addr {
    let instantiate = InstantiateMsg {
        dao_address: dao_addr,
        cw20_code_id: cw20_id,
	fee: Decimal::percent(3),
	fee_receiver: Addr::unchecked(DAO_UP_ADDR),
        funding_goal: Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(funding_goal),
        },
        funding_token_name: "Bong Launch".to_string(),
        funding_token_symbol: "LBONG".to_string(),
        campaign_info: Campaign {
            name: "Bong DAO".to_string(),
            description: "We're raising money to buy a bong!".to_string(),
            website: None,
            twitter: None,
            discord: None,
            image_url: None,
            hidden: true,
        },
    };

    app.instantiate_contract(
        escrow_id,
        Addr::unchecked(CREATOR_ADDR),
        &instantiate,
        &[],
        "Bong DAO",
        None,
    )
    .unwrap()
}

fn fund_escrow_from_dao(app: &mut App, dao_addr: Addr, escrow_addr: Addr, tokens: u64) {
    let config: cw3_dao::query::ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();

    let gov_token_addr = config.gov_token;

    // Create the proposal.
    let propose_msg = cw3_dao::msg::ExecuteMsg::Propose(cw3_dao::msg::ProposeMsg {
        title: "Seed the Bong DAO fundraising escrow contract".to_string(),
        description: format!(
            "Seeds the Bong DAO fundraising escrow contract with {} tokens",
            tokens
        ),
        msgs: vec![cosmwasm_std::CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: gov_token_addr.to_string(),
            msg: to_binary(&cw20::Cw20ExecuteMsg::Send {
                contract: escrow_addr.to_string(),
                amount: Uint128::from(tokens),
                msg: to_binary("").unwrap(),
            })
            .unwrap(),
            funds: vec![],
        })],
        latest: None,
    });
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_addr.clone(),
        &propose_msg,
        &[],
    )
    .unwrap();
    app.update_block(next_block);

    // Pass the proposal.
    let yes_vote = cw3_dao::msg::ExecuteMsg::Vote(cw3_dao::msg::VoteMsg {
        proposal_id: 1,
        vote: cw3::Vote::Yes,
    });
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_addr.clone(),
        &yes_vote,
        &[],
    )
    .unwrap();
    app.update_block(next_block);

    // Execute the proposal.
    let execute = cw3_dao::msg::ExecuteMsg::Execute { proposal_id: 1 };
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_addr.clone(),
        &execute,
        &[],
    )
    .unwrap();
    app.update_block(next_block);
}

fn close_escrow_from_dao(app: &mut App, dao_addr: Addr, escrow_addr: Addr, tokens: u64) {
    // Create the proposal.
    let propose_msg = cw3_dao::msg::ExecuteMsg::Propose(cw3_dao::msg::ProposeMsg {
        title: "Seed the Bong DAO fundraising escrow contract".to_string(),
        description: format!(
            "Seeds the Bong DAO fundraising escrow contract with {} tokens",
            tokens
        ),
        msgs: vec![cosmwasm_std::CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: escrow_addr.to_string(),
            msg: to_binary(&ExecuteMsg::Close {}).unwrap(),
            funds: vec![],
        })],
        latest: None,
    });
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_addr.clone(),
        &propose_msg,
        &[],
    )
    .unwrap();
    app.update_block(next_block);

    // Pass the proposal.
    let yes_vote = cw3_dao::msg::ExecuteMsg::Vote(cw3_dao::msg::VoteMsg {
        proposal_id: 2,
        vote: cw3::Vote::Yes,
    });
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_addr.clone(),
        &yes_vote,
        &[],
    )
    .unwrap();
    app.update_block(next_block);

    // Execute the proposal.
    let execute = cw3_dao::msg::ExecuteMsg::Execute { proposal_id: 2 };
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_addr.clone(),
        &execute,
        &[],
    )
    .unwrap();
    app.update_block(next_block);
}

#[test]
fn test_campaign_creation() {
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

    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let dao_addr = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr =
        instantiate_escrow(&mut app, dao_addr.clone(), escrow_id, cw20_id, 100_000_000);

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), 100_000_000);

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    assert_eq!(
        state.status,
        Status::Open {
            token_price: Decimal::from_ratio(100_000_000 as u64, 100_000_000 as u64)
        }
    );
    assert_eq!(state.dao_addr, dao_addr);
    assert_eq!(state.funding_goal.amount, Uint128::from(100_000_000 as u64));
    assert_eq!(state.funds_raised.amount, Uint128::zero());
    assert_eq!(state.creator, Addr::unchecked(CREATOR_ADDR));
    assert_eq!(
        state.funding_token_info,
        cw20::TokenInfoResponse {
            name: "Bong Launch".to_string(),
            symbol: "LBONG".to_string(),
            decimals: 6,
            total_supply: Uint128::zero(),
        }
    );
    assert_eq!(
	state.gov_token_info,
        cw20::TokenInfoResponse {
            name: "Bong DAO".to_string(),
            symbol: "BDAO".to_string(),
            decimals: 6,
            total_supply: Uint128::from(100100000000 as u64),
        }
    );

    let config: cw3_dao::query::ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();
    let gov_token_addr = config.gov_token;

    assert_eq!(gov_token_addr, state.gov_token_addr);

    // Send some tokens to the escrow outside of the regular send
    // message. This should not change progress towards the funding
    // goal.
    //
    // This behavior is important because if we count tokens sent
    // outside of fund messages we could eclipse the funding
    // goal. This creates strange logic around when to close the
    // campaign.
    app.execute(
        Addr::unchecked(CREATOR_ADDR),
        CosmosMsg::Bank(BankMsg::Send {
            to_address: escrow_addr.to_string(),
            amount: vec![Coin {
                amount: Uint128::from(1 as u64),
                denom: CHAIN_DENOM.to_string(),
            }],
        }),
    )
    .unwrap();

    let funds_raised: Coin = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::FundsRaised {})
        .unwrap();
    assert_eq!(funds_raised.amount, Uint128::zero());
}

fn do_fund_refund(funding_goal: u64, gov_tokens: u64) {
    let backers: Vec<_> = (0..10).map(|i| format!("backer_{}", i)).collect();
    let backers_for_lambda = backers.clone();
    let backer_initial_balance = Uint128::from(1_000_000_000 as u64);

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
        for addr in backers_for_lambda {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(addr),
                    vec![Coin {
                        denom: CHAIN_DENOM.to_string(),
                        amount: backer_initial_balance,
                    }],
                )
                .unwrap();
        }
    });

    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let dao_addr = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr =
        instantiate_escrow(&mut app, dao_addr.clone(), escrow_id, cw20_id, funding_goal);

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), gov_tokens);

    let token_price = Decimal::from_ratio(gov_tokens, funding_goal);

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    assert_eq!(state.status, Status::Open { token_price });

    if gov_tokens < funding_goal {
        // Fund with am amount smaller than the price of the smallest
        // token denom. This should fail as it would cause zero tokens to
        // be issued.
        let err: ContractError = app
            .execute_contract(
                Addr::unchecked("backer_1"),
                escrow_addr.clone(),
                &ExecuteMsg::Fund {},
                &[Coin {
                    denom: CHAIN_DENOM.to_string(),
                    amount: Uint128::from(1 as u64),
                }],
            )
            .unwrap_err()
            .downcast()
            .unwrap();
        assert_eq!(err, ContractError::SmallContribution { token_price });
    }

    let backer_contribution = Uint128::from(funding_goal / (backers.len() as u64));

    // Send some funds and then instantly request a refund.
    for backer in backers[0..backers.len() / 2].iter() {
        app.execute_contract(
            Addr::unchecked(backer),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: backer_contribution,
            }],
        )
        .unwrap();

        // Verify that tokens were issued
        let balance: cw20::BalanceResponse = app
            .wrap()
            .query_wasm_smart(
                state.funding_token_addr.clone(),
                &cw20::Cw20QueryMsg::Balance {
                    address: backer.to_string(),
                },
            )
            .unwrap();
        let expected_balance = backer_contribution * token_price;
        assert_eq!(balance.balance, expected_balance,);

        if gov_tokens > funding_goal {
            // Try and refund a number of tokens that would result in zero
            // ujuno being sent back. This should fail.
            let err: ContractError = app
                .execute_contract(
                    Addr::unchecked(backer),
                    state.funding_token_addr.clone(),
                    &cw20::Cw20ExecuteMsg::Send {
                        contract: escrow_addr.to_string(),
                        amount: Uint128::from(1 as u64),
                        msg: to_binary("hello").unwrap(),
                    },
                    &[],
                )
                .unwrap_err()
                .downcast()
                .unwrap();
            assert_eq!(err, ContractError::SmallRefund { token_price });
        }

        // Return all the backers tokens.
        app.execute_contract(
            Addr::unchecked(backer),
            state.funding_token_addr.clone(),
            &cw20::Cw20ExecuteMsg::Send {
                contract: escrow_addr.to_string(),
                amount: balance.balance,
                msg: to_binary("hello").unwrap(),
            },
            &[],
        )
        .unwrap();

        // Check that the funds were returned. Note that the final
        // balance here may be slightly less than the contributed
        // amount if interesting token prices cause rounding down.
        let backer_balance = app.wrap().query_balance(backer, CHAIN_DENOM).unwrap();
        assert_eq!(
            backer_balance.amount,
            backer_initial_balance - backer_contribution
                + expected_balance * token_price.inv().unwrap()
        );
    }

    let escrow_balance = app
        .wrap()
        .query_balance(escrow_addr.clone(), CHAIN_DENOM)
        .unwrap();

    // It is possible that after a number of refunds the escrow
    // account has a non-zero balance as token_price *
    // token_price.inv() may round down.
    let expected_escrow_balance = Uint128::from((backers.len() / 2) as u64)
        * (backer_contribution - backer_contribution * token_price * token_price.inv().unwrap());

    assert_eq!(escrow_balance.amount, expected_escrow_balance);

    let mut sent = expected_escrow_balance;
    // Fully fund the contract.
    for backer in backers.iter() {
        app.execute_contract(
            Addr::unchecked(backer),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: if sent + backer_contribution > Uint128::from(funding_goal) {
                    Uint128::from(funding_goal) - sent
                } else {
                    backer_contribution
                },
            }],
        )
        .unwrap();

        sent += backer_contribution;
    }

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    // Verify that the campaign has completed.
    assert_eq!(state.status, Status::Funded { token_price });

    let token_info: cw20::TokenInfoResponse = app
        .wrap()
        .query_wasm_smart(state.funding_token_addr, &cw20::Cw20QueryMsg::TokenInfo {})
        .unwrap();

    // If the number of tokens divides the funding goal then we
    // shouldn't need to do any rounding down. In the case that it is
    // not we ought to round down when doing our distribution math.
    if funding_goal % gov_tokens == 0 {
        assert_eq!(token_info.total_supply, Uint128::from(gov_tokens))
    } else {
        assert!(token_info.total_supply <= Uint128::from(gov_tokens))
    }
}

#[test]
fn test_funding_refunding_divisible() {
    let funding_goal = 100_000_000;
    let gov_tokens = 50_000_000;

    do_fund_refund(funding_goal, gov_tokens);
}

#[test]
fn test_funding_refunding_non_divisible() {
    let funding_goal = 100_000_000;
    let gov_tokens = 50_000_001;

    do_fund_refund(funding_goal, gov_tokens);
}

#[test]
fn test_funding_refunding_non_divisble_more_gov() {
    let funding_goal = 100_000_000;
    let gov_tokens = 100_000_001;

    do_fund_refund(funding_goal, gov_tokens);
}

#[test]
fn test_funding_refunding_divisble_more_gov() {
    let funding_goal = 100_000_000;
    let gov_tokens = 200_000_000;

    do_fund_refund(funding_goal, gov_tokens);
}

#[test]
fn test_campaign_completion() {
    let funding_goal = 100_000_000;
    let gov_tokens = 200_000_00;
    let token_price = Decimal::from_ratio(gov_tokens, funding_goal);

    let backers: Vec<_> = (0..10).map(|i| format!("backer_{}", i)).collect();
    let backers_for_lambda = backers.clone();
    let backer_initial_balance = Uint128::from(1_000_000_000 as u64);

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
        for addr in backers_for_lambda {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(addr),
                    vec![Coin {
                        denom: CHAIN_DENOM.to_string(),
                        amount: backer_initial_balance,
                    }],
                )
                .unwrap();
        }
    });

    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let dao_addr = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr =
        instantiate_escrow(&mut app, dao_addr.clone(), escrow_id, cw20_id, funding_goal);

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), gov_tokens);

    let backer_contribution = Uint128::from(funding_goal / (backers.len() as u64));
    let expected_escrow_balance = Uint128::from((backers.len() / 2) as u64)
        * (backer_contribution - backer_contribution * token_price * token_price.inv().unwrap());

    let mut sent = expected_escrow_balance;

    // Fund the campaign.
    for backer in backers.iter() {
        app.execute_contract(
            Addr::unchecked(backer),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: if sent + backer_contribution > Uint128::from(funding_goal) {
                    Uint128::from(funding_goal) - sent
                } else {
                    backer_contribution
                },
            }],
        )
        .unwrap();

        sent += backer_contribution;
    }

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    // Verify that the campaign has completed.
    assert_eq!(state.status, Status::Funded { token_price });

    let dao_config: cw3_dao::query::ConfigResponse = app
        .wrap()
        .query_wasm_smart(
            state.dao_addr.clone(),
            &cw3_dao::msg::QueryMsg::GetConfig {},
        )
        .unwrap();

    // Swap for gov tokens.
    for backer in backers.iter() {
        app.execute_contract(
            Addr::unchecked(backer),
            state.funding_token_addr.clone(),
            &cw20::Cw20ExecuteMsg::Send {
                contract: escrow_addr.to_string(),
                amount: backer_contribution * token_price,
                msg: to_binary("hello").unwrap(),
            },
            &[],
        )
        .unwrap();

        // Verify that we have received our gov tokens.
        let balance: cw20::BalanceResponse = app
            .wrap()
            .query_wasm_smart(
                dao_config.gov_token.clone(),
                &cw20::Cw20QueryMsg::Balance {
                    address: backer.to_string(),
                },
            )
            .unwrap();
        let expected_balance = backer_contribution * token_price;
        assert_eq!(balance.balance, expected_balance);
    }

    let expected_fee = Uint128::from(funding_goal) * Decimal::percent(3);
    let expected_dao = Uint128::from(funding_goal) - expected_fee;

    let dao_balance = app
        .wrap()
        .query_balance(dao_addr.clone(), CHAIN_DENOM)
        .unwrap();
    assert_eq!(dao_balance.amount, expected_dao);

    let dao_up_balance = app.wrap().query_balance(Addr::unchecked(DAO_UP_ADDR), CHAIN_DENOM).unwrap();
    assert_eq!(dao_up_balance.amount, expected_fee);
}

#[test]
fn test_campaign_close() {
    let funding_goal = 100_000_000;
    let gov_tokens = 200_000_00;
    let token_price = Decimal::from_ratio(gov_tokens, funding_goal);

    let backers: Vec<_> = (0..10).map(|i| format!("backer_{}", i)).collect();
    let backers_for_lambda = backers.clone();
    let backer_initial_balance = Uint128::from(1_000_000_000 as u64);

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
        for addr in backers_for_lambda {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(addr),
                    vec![Coin {
                        denom: CHAIN_DENOM.to_string(),
                        amount: backer_initial_balance,
                    }],
                )
                .unwrap();
        }
    });

    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let dao_addr = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr =
        instantiate_escrow(&mut app, dao_addr.clone(), escrow_id, cw20_id, funding_goal);

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), gov_tokens);

    let backer_contribution = Uint128::from(funding_goal / (backers.len() as u64));
    let expected_escrow_balance = Uint128::from((backers.len() / 2) as u64)
        * (backer_contribution - backer_contribution * token_price * token_price.inv().unwrap());

    let mut sent = expected_escrow_balance;

    // Fund the campaign.
    for backer in backers[0..backers.len() / 2].iter() {
        app.execute_contract(
            Addr::unchecked(backer),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: if sent + backer_contribution > Uint128::from(funding_goal) {
                    Uint128::from(funding_goal) - sent
                } else {
                    backer_contribution
                },
            }],
        )
        .unwrap();

        sent += backer_contribution;
    }

    // Only the DAO may close the campaign.
    let err: ContractError = app
        .execute_contract(
            Addr::unchecked("backer_1"),
            escrow_addr.clone(),
            &ExecuteMsg::Close {},
            &[],
        )
        .unwrap_err()
        .downcast()
        .unwrap();

    assert_eq!(err, ContractError::Unauthorized {});

    close_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), gov_tokens);

    let dao_config: cw3_dao::query::ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();
    let escrow_gov_balance: cw20::BalanceResponse = app
        .wrap()
        .query_wasm_smart(
            dao_config.gov_token,
            &cw20::Cw20QueryMsg::Balance {
                address: escrow_addr.to_string(),
            },
        )
        .unwrap();
    assert_eq!(escrow_gov_balance.balance, Uint128::zero());

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    // Verify that the campaign has completed.
    assert_eq!(state.status, Status::Cancelled { token_price });

    // Funding should not work.
    let err: ContractError = app
        .execute_contract(
            Addr::unchecked("backer_1"),
            escrow_addr.clone(),
            &ExecuteMsg::Fund {},
            &[Coin {
                denom: CHAIN_DENOM.to_string(),
                amount: Uint128::from(50_000 as u64),
            }],
        )
        .unwrap_err()
        .downcast()
        .unwrap();

    assert_eq!(err, ContractError::NotOpen {});

    // Refunds should still work.
    app.execute_contract(
        Addr::unchecked("backer_1"),
        state.funding_token_addr.clone(),
        &cw20::Cw20ExecuteMsg::Send {
            contract: escrow_addr.to_string(),
            amount: Uint128::from(1 as u64),
            msg: to_binary("hello").unwrap(),
        },
        &[],
    )
    .unwrap();
}
