#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Addr, BankMsg, Binary, Coin, Decimal, Deps, DepsMut, Env, Fraction, MessageInfo,
    Reply, Response, StdError, StdResult, SubMsg, Uint128, WasmMsg,
};
use cw2::set_contract_version;
use cw20::Cw20ReceiveMsg;
use cw_utils::parse_reply_instantiate_data;

use crate::error::ContractError;
use crate::msg::{DumpStateResponse, ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Campaign, FeeManagerState, Status};
use crate::state::{State, FUNDING_TOKEN_ADDR, GOV_TOKEN_ADDR, STATE};

const CONTRACT_NAME: &str = "crates.io:cw20-dao-crowdfund";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

const INSTANTIATE_FUNDING_TOKEN_REPLY_ID: u64 = 0;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let dao_addr = deps.api.addr_validate(msg.dao_address.as_str())?;
    let dao_config: cw3_dao::query::ConfigResponse = deps
        .querier
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})?;

    // Verify fee manager address.
    let fee_manager_addr = deps.api.addr_validate(msg.fee_manager_address.as_str())?;

    // DAO shouldn't have an invalid gov token address but lets verify
    // just to be sure.
    let gov_token_addr = deps.api.addr_validate(dao_config.gov_token.as_str())?;
    GOV_TOKEN_ADDR.save(deps.storage, &gov_token_addr)?;

    if msg.funding_goal.amount == Uint128::zero() {
        return Err(ContractError::Instantiation(format!(
            "funding goal is zero ({})",
            msg.funding_goal
        )));
    }

    let state = State {
        status: Status::Uninstantiated {},
        dao_addr,
        fee_manager_addr,
        creator: info.sender.clone(),
        funding_goal: msg.funding_goal.clone(),
        funds_raised: Coin {
            denom: msg.funding_goal.denom,
            amount: Uint128::zero(),
        },
        campaign_info: msg.campaign_info.clone(),
    };
    STATE.save(deps.storage, &state)?;

    // Require fee to display the campaign publicly.
    let response = if !msg.campaign_info.hidden {
        Response::default().add_message(take_public_payment(&deps, &info, &state)?)
    } else {
        Response::default()
    };

    let code_id = msg.cw20_code_id;
    let birth_msg = WasmMsg::Instantiate {
        code_id,
        funds: vec![],
        admin: None,
        label: format!("DAO Up! campaign ({}) gov token", msg.campaign_info.name),
        msg: to_binary(&cw20_base::msg::InstantiateMsg {
            name: msg.funding_token_name,
            symbol: msg.funding_token_symbol,
            decimals: 6,
            initial_balances: vec![],
            mint: Some(cw20::MinterResponse {
                minter: env.contract.address.to_string(),
                cap: None,
            }),
            marketing: None,
        })?,
    };

    let msg = SubMsg::reply_on_success(birth_msg, INSTANTIATE_FUNDING_TOKEN_REPLY_ID);

    Ok(response
        .add_attribute("method", "instantiate")
        .add_submessage(msg))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Fund {} => execute_fund(deps, &info.funds, info.sender),
        ExecuteMsg::Receive(msg) => execute_receive(deps, msg, info.sender),
        ExecuteMsg::Close {} => execute_close(deps, env, info.sender),
        ExecuteMsg::UpdateCampaign { campaign } => execute_update_campaign(deps, info, campaign),
    }
}

pub fn execute_update_campaign(
    deps: DepsMut,
    info: MessageInfo,
    new_campaign_info: Campaign,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    if info.sender != state.dao_addr {
        return Err(ContractError::Unauthorized {});
    }

    // Require fee to display the campaign publicly.
    let response = if !new_campaign_info.hidden && state.campaign_info.hidden {
        Response::default().add_message(take_public_payment(&deps, &info, &state)?)
    } else {
        Response::default()
    };

    state.campaign_info = new_campaign_info;
    STATE.save(deps.storage, &state)?;

    Ok(response
        .add_attribute("action", "update_campaign")
        .add_attribute("sender", info.sender))
}

pub fn execute_close(deps: DepsMut, env: Env, sender: Addr) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    if sender != state.dao_addr {
        return Err(ContractError::Unauthorized {});
    }
    let (token_price, initial_gov_token_balance) = match state.status {
        Status::Open {
            token_price,
            initial_gov_token_balance,
        } => (token_price, initial_gov_token_balance),
        _ => return Err(ContractError::InvalidClose {}),
    };

    // Return the governance tokens to the DAO.
    let dao_addr = state.dao_addr.clone();
    let dao_config: cw3_dao::query::ConfigResponse = deps
        .querier
        .query_wasm_smart(dao_addr.clone(), &cw3_dao::msg::QueryMsg::GetConfig {})?;
    let gov_addr = dao_config.gov_token;
    let gov_balance: cw20::BalanceResponse = deps.querier.query_wasm_smart(
        gov_addr.clone(),
        &cw20::Cw20QueryMsg::Balance {
            address: env.contract.address.to_string(),
        },
    )?;

    let return_msg = WasmMsg::Execute {
        contract_addr: gov_addr.to_string(),
        msg: to_binary(&cw20::Cw20ExecuteMsg::Transfer {
            recipient: dao_addr.to_string(),
            amount: gov_balance.balance,
        })?,
        funds: vec![],
    };

    state.status = Status::Cancelled {
        token_price,
        initial_gov_token_balance,
    };
    STATE.save(deps.storage, &state)?;
    Ok(Response::default()
        .add_attribute("action", "close")
        .add_attribute("sender", sender)
        .add_message(return_msg))
}

pub fn execute_fund(
    deps: DepsMut,
    funds: &[Coin],
    sender: Addr,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;

    let (token_price, initial_gov_token_balance) = match state.status {
        Status::Open {
            token_price,
            initial_gov_token_balance,
        } => Ok((token_price, initial_gov_token_balance)),
        _ => Err(ContractError::NotOpen {}),
    }?;

    let payment = funds
        .iter()
        .filter(|coin| coin.denom == state.funding_goal.denom)
        .fold(Uint128::zero(), |accum, coin| coin.amount + accum);

    // Don't allow funding over the funding goal.
    if state.funds_raised.amount + payment > state.funding_goal.amount {
        return Err(ContractError::FundingOverflow {});
    }

    // Update the amount raised.
    state.funds_raised.amount += payment;
    // If we've met the funding goal set the state to complete.
    if state.funds_raised.amount == state.funding_goal.amount {
        state.status = Status::Funded {
            token_price,
            initial_gov_token_balance,
        };
    }
    STATE.save(deps.storage, &state)?;

    let funding_tokens_owed = token_price * payment;

    // Reject transactions that would cause no tokens to be
    // issued. This could happen if the smallest token's price is
    // greater than the contribution.
    if funding_tokens_owed.is_zero() {
        return Err(ContractError::SmallContribution { token_price });
    }

    let funding_token_address = FUNDING_TOKEN_ADDR.load(deps.storage)?;
    let mint_msg = WasmMsg::Execute {
        contract_addr: funding_token_address.to_string(),
        msg: to_binary(&cw20_base::msg::ExecuteMsg::Mint {
            recipient: sender.to_string(),
            amount: funding_tokens_owed,
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
    deps: DepsMut,
    msg: Cw20ReceiveMsg,
    sender: Addr,
) -> Result<Response, ContractError> {
    let gov_token_addr = GOV_TOKEN_ADDR.load(deps.storage)?;
    let funding_token_addr = FUNDING_TOKEN_ADDR.load(deps.storage)?;
    if sender == gov_token_addr {
        execute_receive_gov_tokens(deps, msg)
    } else if sender == funding_token_addr {
        execute_receive_funding_tokens(deps, msg, funding_token_addr)
    } else {
        Err(ContractError::Unauthorized {})
    }
}

pub fn execute_receive_gov_tokens(
    deps: DepsMut,
    msg: Cw20ReceiveMsg,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    match state.status {
        Status::Pending {} => {
            let token_price = Decimal::from_ratio(msg.amount, state.funding_goal.amount);
            // Not strictly needed as fund transactions will fail the
            // the token price is zero but slightly better UX.
            if token_price.is_zero() {
                return Err(ContractError::InvalidGovTokenAmount {});
            }

            state.status = Status::Open {
                token_price,
                initial_gov_token_balance: msg.amount,
            };
            STATE.save(deps.storage, &state)?;
            Ok(Response::default()
                .add_attribute("action", "fund_gov_tokens")
                .add_attribute("amount", msg.amount))
        }
        _ => Err(ContractError::NotPending {}),
    }
}

pub fn execute_receive_funding_tokens(
    deps: DepsMut,
    msg: Cw20ReceiveMsg,
    funding_token_addr: Addr,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    match state.status {
        Status::Pending {} | Status::Uninstantiated {} => Err(ContractError::NotOpen {}),
        Status::Open { token_price, .. } | Status::Cancelled { token_price, .. } => {
            // User is sending tokens back to the contract indicating
            // that they would like a refund.
            let sender = deps.api.addr_validate(&msg.sender)?;

            // Token price is in tokens / native. `tokens * 1 /
            // (tokens / native)` = native owed.
            let native_owed = msg.amount * token_price.inv().unwrap();
            if native_owed.is_zero() {
                return Err(ContractError::SmallRefund { token_price });
            }

            let bank_msg = BankMsg::Send {
                to_address: sender.to_string(),
                amount: vec![Coin {
                    denom: state.funding_goal.denom.clone(),
                    amount: native_owed,
                }],
            };

            // Burn the returned tokens.
            let burn_msg = WasmMsg::Execute {
                contract_addr: funding_token_addr.to_string(),
                msg: to_binary(&cw20::Cw20ExecuteMsg::Burn { amount: msg.amount })?,
                funds: vec![],
            };

            // Update the funding goal counter.
            state.funds_raised.amount -= native_owed;
            STATE.save(deps.storage, &state)?;

            Ok(Response::default()
                .add_attribute("action", "refund")
                .add_attribute("sender", sender)
                .add_attribute("tokens_returned", msg.amount)
                .add_attribute("native_returned", native_owed)
                .add_message(bank_msg)
                .add_message(burn_msg))
        }
        Status::Funded { token_price, .. } => {
            // User is sending tokens back to the contract indicating
            // that they would like staked governance tokens.
            let sender = deps.api.addr_validate(&msg.sender)?;

            // Some math here. TL;DR there will always be a 1:1
            // relationship between funding tokens and gov tokens.
            //
            // token_price = gov_tokens / funding_goal
            // => funding_goal * token_price = gov_tokens
            //
            // Once funding goal has been met we will have issued
            // `gov_tokens` tokens. This is a slightly idealized
            // example because in real life there is rounding which we
            // always round down but insofar as what we issue this is
            // correct.
            let gov_owed = msg.amount;

            let state = STATE.load(deps.storage)?;
            let dao_config: cw3_dao::query::ConfigResponse = deps.querier.query_wasm_smart(
                state.dao_addr.clone(),
                &cw3_dao::msg::QueryMsg::GetConfig {},
            )?;
            let gov_addr = dao_config.gov_token;
            let dao_addr = state.dao_addr.to_string();

            // Transfer gov tokens to the sender.
            let token_transfer = WasmMsg::Execute {
                contract_addr: gov_addr.to_string(),
                msg: to_binary(&cw20::Cw20ExecuteMsg::Transfer {
                    recipient: sender.to_string(),
                    amount: gov_owed,
                })?,
                funds: vec![],
            };

            // Get fee manager information.
            let fee_manager_state = get_fee_manager_state(&deps, &state)?;

            let native_to_transfer = msg.amount * token_price.inv().unwrap();
            let fee_amount = native_to_transfer * fee_manager_state.fee_percent;
            let dao_amount = native_to_transfer - fee_amount;

            // Transfer a proportional amount of funds to the DAO.
            let dao_transfer = BankMsg::Send {
                to_address: dao_addr,
                amount: vec![Coin {
                    denom: state.funding_goal.denom.clone(),
                    amount: dao_amount,
                }],
            };

            // Transfer fee to the fee account.
            let fee_transfer = BankMsg::Send {
                to_address: fee_manager_state.receiver_addr.to_string(),
                amount: vec![Coin {
                    denom: state.funding_goal.denom,
                    amount: fee_amount,
                }],
            };

            Ok(Response::default()
                .add_attribute("action", "swap_for_gov")
                .add_attribute("sender", sender)
                .add_message(token_transfer)
                .add_message(dao_transfer)
                .add_message(fee_transfer))
        }
    }
}

pub fn get_fee_manager_state(deps: &DepsMut, state: &State) -> Result<FeeManagerState, StdError> {
    Ok(deps.querier.query_wasm_smart(
        state.fee_manager_addr.clone(),
        // TODO: Change to correct msg.
        &cw3_dao::msg::QueryMsg::GetConfig {},
    )?)
}

// Ensure public payment funds were sent and create a message to forward them to the fee receiver.
// Return a ContractError::InvalidPublicPayment if funds were not properly sent.
pub fn take_public_payment(
    deps: &DepsMut,
    info: &MessageInfo,
    state: &State,
) -> Result<BankMsg, ContractError> {
    // Get fee manager information.
    let fee_manager_state = get_fee_manager_state(deps, state)?;

    let payment = info
        .funds
        .iter()
        .filter(|coin| coin.denom == fee_manager_state.public_listing_fee.denom)
        .fold(Uint128::zero(), |accum, coin| coin.amount + accum);

    if payment != fee_manager_state.public_listing_fee.amount {
        return Err(ContractError::InvalidPublicPayment(format!(
            "not equal to {}{}",
            fee_manager_state.public_listing_fee.amount, fee_manager_state.public_listing_fee.denom
        )));
    }

    // Transfer public listing fee to the fee account.
    Ok(BankMsg::Send {
        to_address: fee_manager_state.receiver_addr.to_string(),
        amount: vec![fee_manager_state.public_listing_fee.clone()],
    })
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GovTokenAddr {} => query_gov_token_addr(deps),
        QueryMsg::FundingTokenAddr {} => query_funding_token_addr(deps),
        QueryMsg::Status {} => query_status(deps),
        QueryMsg::FundsRaised {} => query_funds_raised(deps),
        QueryMsg::DumpState {} => query_dump_state(deps),
    }
}

pub fn query_gov_token_addr(deps: Deps) -> StdResult<Binary> {
    let gov_token_addr = GOV_TOKEN_ADDR.load(deps.storage)?;
    to_binary(&gov_token_addr)
}

pub fn query_funding_token_addr(deps: Deps) -> StdResult<Binary> {
    let funding_token_addr = FUNDING_TOKEN_ADDR.load(deps.storage)?;
    to_binary(&funding_token_addr)
}

pub fn query_status(deps: Deps) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;
    to_binary(&state.status)
}

pub fn query_funds_raised(deps: Deps) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;
    to_binary(&state.funds_raised)
}

pub fn query_dump_state(deps: Deps) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;
    let funding_token_addr = FUNDING_TOKEN_ADDR.load(deps.storage)?;
    let gov_token_addr = GOV_TOKEN_ADDR.load(deps.storage)?;

    let funding_token_info: cw20::TokenInfoResponse = deps.querier.query_wasm_smart(
        funding_token_addr.clone(),
        &cw20::Cw20QueryMsg::TokenInfo {},
    )?;

    let gov_token_info: cw20::TokenInfoResponse = deps
        .querier
        .query_wasm_smart(gov_token_addr.clone(), &cw20::Cw20QueryMsg::TokenInfo {})?;

    to_binary(&DumpStateResponse {
        status: state.status,
        dao_addr: state.dao_addr,
        fee_manager_addr: state.fee_manager_addr,
        funding_goal: state.funding_goal,
        creator: state.creator,
        funds_raised: state.funds_raised,
        funding_token_info,
        gov_token_info,
        campaign_info: state.campaign_info,
        gov_token_addr,
        funding_token_addr,
        version: CONTRACT_VERSION.to_string(),
    })
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn reply(deps: DepsMut, _env: Env, msg: Reply) -> Result<Response, ContractError> {
    match msg.id {
        INSTANTIATE_FUNDING_TOKEN_REPLY_ID => {
            let res = parse_reply_instantiate_data(msg).map_err(|e| {
                ContractError::Instantiation(format!("failed to instantiate gov token: ({})", e))
            })?;
            let token_addr = deps.api.addr_validate(&res.contract_address)?;
            FUNDING_TOKEN_ADDR.save(deps.storage, &token_addr)?;

            let mut state = STATE.load(deps.storage)?;
            state.status = Status::Pending {};
            STATE.save(deps.storage, &state)?;

            Ok(Response::default()
                .add_attribute("method", "reply")
                .add_attribute("funding_token", token_addr))
        }
        _ => Err(ContractError::UnknownReplyId { id: msg.id }),
    }
}
