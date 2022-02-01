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
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::Status::Active;
use crate::state::{State, GOV_TOKEN, STATE};

const CONTRACT_NAME: &str = "crates.io:campaign-escrow";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

const INSTANTIATE_GOV_TOKEN_REPLY_ID: u64 = 0;

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
        status: Active,
        campaign: msg.campaign_info,
    };
    STATE.save(deps.storage, &state)?;

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
            initial_balances: vec![],
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
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Fund {} => execute_fund(deps.as_ref(), &info.funds, info.sender),
        ExecuteMsg::Close {} => todo!(),
        ExecuteMsg::Transfer {} => todo!(),
        ExecuteMsg::Receive(msg) => execute_receive(deps.as_ref(), msg, info.sender),
    }
}

pub fn execute_fund(deps: Deps, funds: &[Coin], sender: Addr) -> Result<Response, ContractError> {
    let config = STATE.load(deps.storage)?;
    let payment = funds
        .iter()
        .filter(|coin| coin.denom == config.token_price.denom)
        .fold(Uint128::zero(), |accum, coin| coin.amount + accum);
    let coins_owned = payment / config.token_price.amount;

    let gov_address = GOV_TOKEN.load(deps.storage)?;

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
    let gov_token = GOV_TOKEN.load(deps.storage)?;
    if sender != gov_token {
        return Err(ContractError::Unauthorized {});
    }

    let config = STATE.load(deps.storage)?;
    let sender = deps.api.addr_validate(&msg.sender)?;
    let native_owed = msg.amount * config.token_price.amount;

    let bank_msg = BankMsg::Send {
        to_address: sender.to_string(),
        amount: vec![Coin {
            denom: config.token_price.denom,
            amount: native_owed,
        }],
    };

    Ok(Response::default()
        .add_attribute("action", "refund")
        .add_attribute("sender", sender)
        .add_attribute("tokens_returned", msg.amount)
        .add_attribute("native_refunded", native_owed)
        .add_message(bank_msg))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::FundingGoal {} => todo!(),
        QueryMsg::TokenPrice {} => todo!(),
        QueryMsg::TotalRaised {} => todo!(),
        QueryMsg::Creator {} => todo!(),
        QueryMsg::Status {} => todo!(),
        QueryMsg::GovToken {} => query_gov_token(deps),
    }
}

pub fn query_gov_token(deps: Deps) -> StdResult<Binary> {
    let gov_token_addr = GOV_TOKEN.load(deps.storage)?;
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
            GOV_TOKEN.save(deps.storage, &&cw20_addr)?;
            Ok(Response::default())
        }
        _ => Err(ContractError::UnknownReplyId { id: msg.id }),
    }
}
