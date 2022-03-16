use cosmwasm_std::{
    to_binary, Addr, BankMsg, Coin, CosmosMsg, Decimal, Empty, Fraction, Uint128, WasmMsg,
};
use cw20::Cw20Coin;
use cw3_dao::msg::GovTokenMsg;
use cw_multi_test::{next_block, App, Contract, ContractWrapper, Executor};
use cw_utils::Duration;

use anyhow::Result as AnyResult;

use crate::{
    msg::{DumpStateResponse, ExecuteMsg, InstantiateMsg, QueryMsg},
    state::{Campaign, Status},
    ContractError,
};

const CREATOR_ADDR: &str = "creator";
const DAO_UP_ADDR: &str = "daoup";
const CHAIN_DENOM: &str = "ujunox";
const PUBLIC_PAYMENT_AMOUNT: u128 = 500000;

fn cw20_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        cw20_base::contract::execute,
        cw20_base::contract::instantiate,
        cw20_base::contract::query,
    );
    Box::new(contract)
}

fn cw20_evil_no_instantiate() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        cw20_no_instantiate::contract::execute,
        cw20_no_instantiate::contract::instantiate,
        cw20_no_instantiate::contract::query,
    );
    Box::new(contract)
}

fn cw20_evil_silent_instantiate_fail() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        cw20_silent_instantiate_fail::contract::execute,
        cw20_silent_instantiate_fail::contract::instantiate,
        cw20_silent_instantiate_fail::contract::query,
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

fn fee_manager_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        fee_manager::contract::execute,
        fee_manager::contract::instantiate,
        fee_manager::contract::query,
    );
    Box::new(contract)
}

fn instantiate_dao(app: &mut App, dao_id: u64, cw20_id: u64, stake_id: u64) -> (Addr, Addr) {
    let fee_manager_id = app.store_code(fee_manager_contract());
    let fee_manager_addr = instantiate_fee_manager(app, fee_manager_id);

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

    (dao_addr, fee_manager_addr)
}

fn instantiate_fee_manager(app: &mut App, fee_manager_id: u64) -> Addr {
    let instantiate = fee_manager::msg::InstantiateMsg {
        receiver_address: DAO_UP_ADDR.to_string(),
        fee: Decimal::percent(3),
        public_listing_fee: Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(PUBLIC_PAYMENT_AMOUNT),
        },
    };

    app.instantiate_contract(
        fee_manager_id,
        Addr::unchecked(DAO_UP_ADDR),
        &instantiate,
        &[],
        "Bong DAO Fee Manager",
        None,
    )
    .unwrap()
}

fn instantiate_msg_factory(
    dao_addr: Addr,
    fee_manager_addr: Addr,
    cw20_id: u64,
    funding_goal: u64,
    hidden: bool,
) -> InstantiateMsg {
    InstantiateMsg {
        dao_address: dao_addr.to_string(),
        fee_manager_address: fee_manager_addr.to_string(),
        cw20_code_id: cw20_id,
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
            profile_image_url: None,
            description_image_urls: vec!["https://moonphase.is/image.svg".to_string()],
            hidden,
        },
    }
}

fn instantiate_escrow(
    app: &mut App,
    dao_addr: Addr,
    fee_manager_addr: Addr,
    escrow_id: u64,
    cw20_id: u64,
    funding_goal: u64,
    hidden: bool,
) -> AnyResult<Addr> {
    let instantiate =
        instantiate_msg_factory(dao_addr, fee_manager_addr, cw20_id, funding_goal, hidden);

    app.instantiate_contract(
        escrow_id,
        Addr::unchecked(CREATOR_ADDR),
        &instantiate,
        &[],
        "Bong DAO",
        None,
    )
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

fn update_campaign_from_dao(
    app: &mut App,
    dao_addr: Addr,
    escrow_addr: Addr,
    new_campaign: Campaign,
    funds: Vec<Coin>,
    // If updating multiple times in one test,
    // use this to increment the proposal ID since a new one is created each time.
    proposal_id_offset: u64,
) -> AnyResult<()> {
    // Create the proposal.
    let propose_msg = cw3_dao::msg::ExecuteMsg::Propose(cw3_dao::msg::ProposeMsg {
        title: "Seed the Bong DAO fundraising escrow contract".to_string(),
        description: "Update the Bong DAO config.".to_string(),
        msgs: vec![cosmwasm_std::CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr: escrow_addr.to_string(),
            msg: to_binary(&ExecuteMsg::UpdateCampaign {
                campaign: new_campaign,
            })
            .unwrap(),
            funds,
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
        proposal_id: 2 + proposal_id_offset,
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
    let execute = cw3_dao::msg::ExecuteMsg::Execute {
        proposal_id: 2 + proposal_id_offset,
    };
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        dao_addr.clone(),
        &execute,
        &[],
    )?;
    app.update_block(next_block);

    Ok(())
}

fn close_escrow_from_dao(app: &mut App, dao_addr: Addr, escrow_addr: Addr) {
    // Create the proposal.
    let propose_msg = cw3_dao::msg::ExecuteMsg::Propose(cw3_dao::msg::ProposeMsg {
        title: "Seed the Bong DAO fundraising escrow contract".to_string(),
        description: format!("close the DAO Up! campaign at ({})", escrow_addr),
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
#[should_panic]
fn test_campaign_creation_with_invalid_cw20() {
    let mut app = App::default();
    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        dao_id,
        100_000_000,
        true,
    )
    .unwrap();
}

#[test]
#[should_panic(expected = "I am an evil token")]
fn test_campaign_creation_with_evil_cw20_no_instantiate() {
    let mut app = App::default();

    let cw20_id = app.store_code(cw20_evil_no_instantiate());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        100_000_000,
        true,
    )
    .unwrap();
}

#[test]
fn test_campaign_creation_with_evil_cw20_silent_fail() {
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
    let evil_cw20_id = app.store_code(cw20_evil_silent_instantiate_fail());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        evil_cw20_id,
        100_000_000,
        true,
    )
    .unwrap();
    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), 100_000_000);

    // This should fail as minting new tokens will not be possible.
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &ExecuteMsg::Fund {},
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(10000000u64),
        }],
    )
    .unwrap_err();

    // This should still succede.
    close_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr);

    let config: cw3_dao::query::ConfigResponse = app
        .wrap()
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})
        .unwrap();

    let gov_token_addr = config.gov_token;

    // Verify that tokens were returned
    let balance: cw20::BalanceResponse = app
        .wrap()
        .query_wasm_smart(
            gov_token_addr,
            &cw20::Cw20QueryMsg::Balance {
                address: dao_addr.to_string(),
            },
        )
        .unwrap();
    let expected_balance = Uint128::from(100_000_000_000u64);
    assert_eq!(balance.balance, expected_balance);
}

#[test]
#[should_panic(expected = "Invalid fee manager address.")]
fn test_campaign_creation_with_invalid_fee_manager() {
    let mut app = App::default();

    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let (dao_addr, _) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        // Pass a DAO address as the fee manager to trigger an error.
        dao_addr.clone(),
        escrow_id,
        cw20_id,
        100_000_000,
        true,
    )
    .unwrap();
}

#[test]
fn test_campaign_update() {
    let mut app = App::default();
    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        100_000_000,
        true,
    )
    .unwrap();

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), 100_000_000);

    let new_campaign = Campaign {
        name: "A totally new name".to_string(),
        description: "For a totally new campaign".to_string(),
        website: Some("https://moonphase.is".to_string()),
        twitter: None,
        discord: None,
        profile_image_url: Some("https://moonphase.is/image.svg".to_string()),
        description_image_urls: vec!["https://moonphase.is/image.svg".to_string()],
        hidden: true,
    };

    update_campaign_from_dao(
        &mut app,
        dao_addr,
        escrow_addr.clone(),
        new_campaign.clone(),
        vec![],
        0,
    )
    .unwrap();

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    assert_eq!(state.campaign_info, new_campaign);

    // Try and update the campaign from an unauthorized address.
    let update_message = ExecuteMsg::UpdateCampaign {
        campaign: new_campaign,
    };
    app.execute_contract(
        Addr::unchecked(CREATOR_ADDR),
        escrow_addr.clone(),
        &update_message,
        &[],
    )
    .unwrap_err();
}

#[test]
fn test_campaign_update_with_public_payment() {
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

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    // Send some tokens to the DAO so it can pay for the public payment.
    app.execute(
        Addr::unchecked(CREATOR_ADDR),
        CosmosMsg::Bank(BankMsg::Send {
            to_address: dao_addr.to_string(),
            amount: vec![Coin {
                amount: Uint128::from(PUBLIC_PAYMENT_AMOUNT * 2),
                denom: CHAIN_DENOM.to_string(),
            }],
        }),
    )
    .unwrap();

    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        100_000_000,
        true,
    )
    .unwrap();

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), 100_000_000);

    let mut new_campaign = Campaign {
        name: "A totally new name".to_string(),
        description: "For a totally new campaign".to_string(),
        website: Some("https://moonphase.is".to_string()),
        twitter: None,
        discord: None,
        profile_image_url: Some("https://moonphase.is/image.svg".to_string()),
        description_image_urls: vec!["https://moonphase.is/image.svg".to_string()],
        hidden: false,
    };

    update_campaign_from_dao(
        &mut app,
        dao_addr.clone(),
        escrow_addr.clone(),
        new_campaign.clone(),
        vec![Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(PUBLIC_PAYMENT_AMOUNT),
        }],
        0,
    )
    .unwrap();

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    assert_eq!(state.campaign_info, new_campaign);

    // Check that the public payment funds were sent to the fee receiver.
    let dao_up_balance = app
        .wrap()
        .query_balance(Addr::unchecked(DAO_UP_ADDR), CHAIN_DENOM)
        .unwrap();
    assert_eq!(dao_up_balance.amount, Uint128::from(PUBLIC_PAYMENT_AMOUNT));

    // Update again without changing hidden and without sending a payment to ensure it doesn't require a public payment.
    new_campaign.name = "Yet another new name".to_string();
    update_campaign_from_dao(
        &mut app,
        dao_addr.clone(),
        escrow_addr.clone(),
        new_campaign.clone(),
        vec![],
        1,
    )
    .unwrap();

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    assert_eq!(state.campaign_info, new_campaign);

    // Check that no additional public payment was sent to the DAO (i.e. balance stayed the same).
    let new_dao_up_balance = app
        .wrap()
        .query_balance(Addr::unchecked(DAO_UP_ADDR), CHAIN_DENOM)
        .unwrap();
    assert_eq!(new_dao_up_balance.amount, dao_up_balance.amount);
}

#[test]
fn test_campaign_update_without_public_payment() {
    let mut app = App::default();
    let cw20_id = app.store_code(cw20_contract());
    let dao_id = app.store_code(dao_dao_dao_contract());
    let stake_id = app.store_code(stake_cw20_contract());
    let escrow_id = app.store_code(escrow_contract());

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        100_000_000,
        true,
    )
    .unwrap();

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), 100_000_000);

    let new_campaign = Campaign {
        name: "A totally new name".to_string(),
        description: "For a totally new campaign".to_string(),
        website: Some("https://moonphase.is".to_string()),
        twitter: None,
        discord: None,
        profile_image_url: Some("https://moonphase.is/image.svg".to_string()),
        description_image_urls: vec!["https://moonphase.is/image.svg".to_string()],
        hidden: false,
    };

    let err: ContractError = update_campaign_from_dao(
        &mut app,
        dao_addr,
        escrow_addr.clone(),
        new_campaign.clone(),
        vec![],
        0,
    )
    .unwrap_err()
    .downcast()
    .unwrap();

    assert_eq!(
        err,
        ContractError::InvalidPublicPayment(format!(
            "not equal to {}{}",
            PUBLIC_PAYMENT_AMOUNT, CHAIN_DENOM
        ))
    );

    // Ensure state did not change.
    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();
    assert_ne!(state.campaign_info, new_campaign);
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

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        100_000_000,
        true,
    )
    .unwrap();

    let gov_tokens = 100_000_000;
    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), gov_tokens);

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    assert_eq!(
        state.status,
        Status::Open {
            token_price: Decimal::from_ratio(100_000_000 as u64, 100_000_000 as u64),
            initial_gov_token_balance: Uint128::from(gov_tokens),
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

    assert_eq!(state.campaign_info.profile_image_url, None);
    assert_eq!(
        state.campaign_info.description_image_urls,
        vec!["https://moonphase.is/image.svg"]
    );

    assert_eq!(env!("CARGO_PKG_VERSION"), state.version);

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

#[test]
fn test_campaign_creation_with_public_payment() {
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

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);

    let instantiate = instantiate_msg_factory(
        dao_addr.clone(),
        fee_manager_addr.clone(),
        cw20_id,
        100_000_000,
        false,
    );
    app.instantiate_contract(
        escrow_id,
        Addr::unchecked(CREATOR_ADDR),
        &instantiate,
        &[Coin {
            denom: CHAIN_DENOM.to_string(),
            amount: Uint128::from(PUBLIC_PAYMENT_AMOUNT),
        }],
        "Bong DAO",
        None,
    )
    .unwrap();

    // Check that the public payment funds were sent to the fee receiver.
    let dao_up_balance = app
        .wrap()
        .query_balance(Addr::unchecked(DAO_UP_ADDR), CHAIN_DENOM)
        .unwrap();
    assert_eq!(dao_up_balance.amount, Uint128::from(PUBLIC_PAYMENT_AMOUNT));
}

#[test]
fn test_campaign_creation_without_public_payment() {
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

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let err: ContractError = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        100_000_000,
        false,
    )
    .unwrap_err()
    .downcast()
    .unwrap();

    assert_eq!(
        err,
        ContractError::InvalidPublicPayment(format!(
            "not equal to {}{}",
            PUBLIC_PAYMENT_AMOUNT, CHAIN_DENOM
        ))
    );
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

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        funding_goal,
        true,
    )
    .unwrap();

    fund_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone(), gov_tokens);

    let token_price = Decimal::from_ratio(gov_tokens, funding_goal);

    let state: DumpStateResponse = app
        .wrap()
        .query_wasm_smart(escrow_addr.clone(), &QueryMsg::DumpState {})
        .unwrap();

    assert_eq!(
        state.status,
        Status::Open {
            token_price,
            initial_gov_token_balance: Uint128::from(gov_tokens)
        }
    );

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
    assert_eq!(
        state.status,
        Status::Funded {
            token_price,
            initial_gov_token_balance: Uint128::from(gov_tokens)
        }
    );

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

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        funding_goal,
        true,
    )
    .unwrap();

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
    assert_eq!(
        state.status,
        Status::Funded {
            token_price,
            initial_gov_token_balance: Uint128::from(gov_tokens)
        }
    );

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

    // Ensure DAO has received all the funds except the fee.
    let dao_balance = app
        .wrap()
        .query_balance(dao_addr.clone(), CHAIN_DENOM)
        .unwrap();
    assert_eq!(dao_balance.amount, expected_dao);

    // Ensure fee has been sent.
    let dao_up_balance = app
        .wrap()
        .query_balance(Addr::unchecked(DAO_UP_ADDR), CHAIN_DENOM)
        .unwrap();
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

    let (dao_addr, fee_manager_addr) = instantiate_dao(&mut app, dao_id, cw20_id, stake_id);
    let escrow_addr = instantiate_escrow(
        &mut app,
        dao_addr.clone(),
        fee_manager_addr.clone(),
        escrow_id,
        cw20_id,
        funding_goal,
        true,
    )
    .unwrap();

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

    close_escrow_from_dao(&mut app, dao_addr.clone(), escrow_addr.clone());

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
    assert_eq!(
        state.status,
        Status::Cancelled {
            token_price,
            initial_gov_token_balance: Uint128::from(gov_tokens)
        }
    );

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
