#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Addr, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Reply, Response,
    StdResult, SubMsg, Uint128, WasmMsg,
};
use cw2::set_contract_version;
use cw20::Cw20ReceiveMsg;
use cw_utils::parse_reply_instantiate_data;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, StatusResponse};
use crate::state::Status::{self, Active};
use crate::state::{State, DAO_CODE_ID, GOV_TOKEN_ADDR, STAKING_CODE_ID, STATE};

const CONTRACT_NAME: &str = "crates.io:campaign-escrow";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

const INSTANTIATE_GOV_TOKEN_REPLY_ID: u64 = 0;
const INSTANTIATE_DAO_REPLY_ID: u64 = 1;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    msg.validate()?;

    let state = State {
        creator: info.sender,
        funding_goal: msg.funding_goal,
        token_price: msg.token_price,
        dao_initial_balance: msg.dao_initial_balance,
        status: Active,
        campaign: msg.campaign_info,
    };
    STATE.save(deps.storage, &state)?;
    DAO_CODE_ID.save(deps.storage, &msg.dao_contract_code_id)?;
    STAKING_CODE_ID.save(deps.storage, &msg.staking_contract_code_id)?;

    let gov_code_id = msg.gov_token_code_id;
    let birth_msg = WasmMsg::Instantiate {
        code_id: gov_code_id,
        funds: vec![],
        admin: Some(env.contract.address.to_string()),
        label: format!("DAO Up! {} gov token", state.campaign.name),
        msg: to_binary(&cw20_updatable_minter::msg::InstantiateMsg {
            name: state.campaign.dao_config.token_name,
            symbol: state.campaign.dao_config.token_symbol,
            decimals: 6,
            initial_balances: msg.initial_balances,
            mint: Some(cw20::MinterResponse {
                minter: env.contract.address.to_string(),
                cap: None,
            }),
            marketing: None,
        })?,
    };

    let msg = SubMsg::reply_on_success(birth_msg, INSTANTIATE_GOV_TOKEN_REPLY_ID);

    Ok(Response::default().add_submessage(msg))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Fund {} => execute_fund(deps.as_ref(), &info.funds, info.sender),
        ExecuteMsg::Close {} => execute_close(deps.as_ref(), env, info.sender),
        ExecuteMsg::Transfer {} => execute_transfer(deps, env, info.sender),
        ExecuteMsg::Receive(msg) => execute_receive(deps.as_ref(), msg, info.sender),
    }
}

pub fn execute_fund(deps: Deps, funds: &[Coin], sender: Addr) -> Result<Response, ContractError> {
    let config = STATE.load(deps.storage)?;
    // Check that the status is active.
    if config.status != Status::Active {
        return Err(ContractError::Innactive {});
    }

    let payment = funds
        .iter()
        .filter(|coin| coin.denom == config.token_price.denom)
        .fold(Uint128::zero(), |accum, coin| coin.amount + accum);
    let coins_owned = payment * config.token_price.amount;

    let gov_address = GOV_TOKEN_ADDR.load(deps.storage)?;

    let mint_msg = WasmMsg::Execute {
        contract_addr: gov_address.to_string(),
        msg: to_binary(&cw20_updatable_minter::msg::ExecuteMsg::Mint {
            recipient: sender.to_string(),
            amount: coins_owned,
        })?,
        funds: vec![],
    };

    Ok(Response::default()
        .add_attribute("action", "fund")
        .add_attribute("sender", sender)
        .add_attribute("amount", payment)
        .add_message(mint_msg))
}

pub fn execute_receive(
    deps: Deps,
    msg: Cw20ReceiveMsg,
    sender: Addr,
) -> Result<Response, ContractError> {
    let gov_token = GOV_TOKEN_ADDR.load(deps.storage)?;
    if sender != gov_token {
        return Err(ContractError::Unauthorized {});
    }

    let config = STATE.load(deps.storage)?;
    // Check that the status is active.
    if config.status != Status::Active {
        return Err(ContractError::Innactive {});
    }

    let sender = deps.api.addr_validate(&msg.sender)?;
    let native_owed = msg.amount / config.token_price.amount;

    let bank_msg = BankMsg::Send {
        to_address: sender.to_string(),
        amount: vec![Coin {
            denom: config.token_price.denom,
            amount: native_owed,
        }],
    };

    // Burn the returned tokens.
    let burn_msg = WasmMsg::Execute {
        contract_addr: gov_token.to_string(),
        msg: to_binary(&cw20::Cw20ExecuteMsg::Burn { amount: msg.amount })?,
        funds: vec![],
    };

    Ok(Response::default()
        .add_attribute("action", "refund")
        .add_attribute("sender", sender)
        .add_attribute("tokens_returned", msg.amount)
        .add_attribute("native_refunded", native_owed)
        .add_message(bank_msg)
        .add_message(burn_msg))
}

pub fn execute_close(deps: Deps, env: Env, sender: Addr) -> Result<Response, ContractError> {
    let config = STATE.load(deps.storage)?;
    // Only the campaign creator can call this method.
    if sender != config.creator {
        return Err(ContractError::Unauthorized {});
    }

    // Check that the status is active.
    if config.status != Status::Active {
        return Err(ContractError::Close {});
    }

    let funds_raised = deps
        .querier
        .query_balance(env.contract.address, config.funding_goal.denom.clone())?;
    // The campaign can only be closed if the funding goal has been
    // met.
    if funds_raised.amount < config.funding_goal.amount {
        return Err(ContractError::Close {});
    }

    let gov_token = GOV_TOKEN_ADDR.load(deps.storage)?;
    let dao_code_id = DAO_CODE_ID.load(deps.storage)?;
    let staking_code_id = STAKING_CODE_ID.load(deps.storage)?;

    let dao_config = config.campaign.dao_config;
    // Lets make the DAO..
    let dao_msg = WasmMsg::Instantiate {
        admin: None,
        code_id: dao_code_id,
        msg: to_binary(&cw3_dao::msg::InstantiateMsg {
            name: dao_config.name.clone(),
            description: dao_config.description,
            gov_token: cw3_dao::msg::GovTokenMsg::UseExistingCw20 {
                addr: gov_token.to_string(),
                label: format!("{} DAO DAO DAO staking contract", dao_config.name),
                stake_contract_code_id: staking_code_id,
                unstaking_duration: dao_config.unstaking_duration,
            },
            threshold: dao_config.threshold,
            max_voting_period: dao_config.max_voting_period,
            proposal_deposit_amount: dao_config.proposal_deposit_amount,
            refund_failed_proposals: dao_config.refund_failed_proposals,
            image_url: dao_config.image_url,
        })?,
        funds: vec![],
        label: format!("DAO Up! DAO created by campaign ({})", config.campaign.name),
    };

    let submsg = SubMsg::reply_on_success(dao_msg, INSTANTIATE_DAO_REPLY_ID);

    Ok(Response::default()
        .add_attribute("action", "close")
        .add_attribute("sender", sender)
        .add_submessage(submsg))
}

pub fn execute_transfer(deps: DepsMut, env: Env, sender: Addr) -> Result<Response, ContractError> {
    let config = STATE.load(deps.storage)?;

    // NOTE: anyone can call this method. This is to prevent a
    // malicious creator from closing the contract but not transfering
    // the money to the DAO causing backers to loose all of their
    // funds.

    let dao_addr = match config.status {
        Status::ClosedButNotTransferred { dao_address } => dao_address,
        _ => return Err(ContractError::Transfer {}),
    };
    let gov_addr = GOV_TOKEN_ADDR.load(deps.storage)?;

    // Transfer everything we have.
    let funds_to_move = deps.querier.query_all_balances(env.contract.address)?;

    let mut wasm_msgs = vec![];

    if !config.dao_initial_balance.is_zero() {
        // Mint the DAO its initial token balance.
        let mint_initial_dao_balance = WasmMsg::Execute {
            contract_addr: gov_addr.to_string(),
            msg: to_binary(&cw20_updatable_minter::msg::ExecuteMsg::Mint {
                recipient: dao_addr.to_string(),
                amount: config.dao_initial_balance,
            })?,
            funds: vec![],
        };
        wasm_msgs.push(mint_initial_dao_balance)
    }

    // Send our minting rights to the DAO.
    let transfer_mint = WasmMsg::Execute {
        contract_addr: gov_addr.to_string(),
        msg: to_binary(&cw20_updatable_minter::msg::ExecuteMsg::UpdateMinter {
            minter: dao_addr.to_string(),
        })?,
        funds: vec![],
    };
    wasm_msgs.push(transfer_mint);

    // Send our funds to the DAO.
    let transfer_funds_msg = BankMsg::Send {
        to_address: dao_addr.to_string(),
        amount: funds_to_move,
    };

    // Update the state. The transfer message failing will roll this
    // back.
    STATE.update(deps.storage, |mut state| -> StdResult<State> {
        state.status = Status::Closed {
            dao_address: dao_addr,
        };
        Ok(state)
    })?;

    Ok(Response::default()
        .add_attribute("action", "transfer")
        .add_attribute("sender", sender)
        .add_messages(wasm_msgs)
        .add_message(transfer_funds_msg))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Creator {} => query_creator(deps),
        QueryMsg::Status {} => query_status(deps, env),
        QueryMsg::GovToken {} => query_gov_token(deps),
    }
}

pub fn query_status(deps: Deps, env: Env) -> StdResult<Binary> {
    let config = STATE.load(deps.storage)?;
    let funds_raised = deps
        .querier
        .query_balance(env.contract.address, config.funding_goal.denom.clone())?;
    let status = StatusResponse {
        status: config.status,
        funds_raised,
        funding_goal: config.funding_goal,
    };
    to_binary(&status)
}

pub fn query_creator(deps: Deps) -> StdResult<Binary> {
    let config = STATE.load(deps.storage)?;
    to_binary(&config.creator)
}

pub fn query_gov_token(deps: Deps) -> StdResult<Binary> {
    let gov_token_addr = GOV_TOKEN_ADDR.load(deps.storage)?;
    to_binary(&gov_token_addr)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn reply(deps: DepsMut, _env: Env, msg: Reply) -> Result<Response, ContractError> {
    match msg.id {
        INSTANTIATE_GOV_TOKEN_REPLY_ID => {
            let res = parse_reply_instantiate_data(msg).map_err(|e| {
                ContractError::Instantiation(format!("failed to instantiate gov token: ({})", e))
            })?;
            let cw20_addr = deps.api.addr_validate(&res.contract_address)?;
            GOV_TOKEN_ADDR.save(deps.storage, &cw20_addr)?;
            Ok(Response::default())
        }
        INSTANTIATE_DAO_REPLY_ID => {
            let res = parse_reply_instantiate_data(msg).map_err(|e| {
                ContractError::Instantiation(format!("failed to instantiate dao contract: ({})", e))
            })?;
            let dao_addr = deps.api.addr_validate(&res.contract_address)?;
            STATE.update(deps.storage, |mut state| -> StdResult<State> {
                state.status = Status::ClosedButNotTransferred {
                    dao_address: dao_addr,
                };
                Ok(state)
            })?;
            Ok(Response::default())
        }
        _ => Err(ContractError::UnknownReplyId { id: msg.id }),
    }
}
