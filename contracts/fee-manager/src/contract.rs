#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ConfigResponse, ConfigUpdate, ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Config, State, STATE};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:fee-manager";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    // Validate config.
    crate::validators::validate_fee(msg.fee)?;
    let fee_receiver = deps.api.addr_validate(&msg.fee_receiver)?;
    let public_listing_fee_receiver = deps.api.addr_validate(&msg.public_listing_fee_receiver)?;

    let state = State {
        owner: info.sender,
        config: Config {
            fee: msg.fee,
            fee_receiver,
            public_listing_fee: msg.public_listing_fee,
            public_listing_fee_receiver,
        },
    };
    STATE.save(deps.storage, &state)?;

    Ok(Response::default()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", state.owner.to_string())
        .add_attribute("fee", state.config.fee.to_string())
        .add_attribute("fee_receiver", state.config.fee_receiver.to_string())
        .add_attribute(
            "public_listing_fee",
            format!(
                "{}{}",
                state.config.public_listing_fee.amount, state.config.public_listing_fee.denom
            ),
        )
        .add_attribute(
            "public_listing_fee_receiver",
            state.config.public_listing_fee_receiver.to_string(),
        ))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Update { config } => execute_update(deps, info, config),
    }
}

pub fn execute_update(
    deps: DepsMut,
    info: MessageInfo,
    config: ConfigUpdate,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    // Verify sender has permission to update config.
    if info.sender != state.owner {
        return Err(ContractError::Unauthorized {});
    }

    // Validate and update config.
    if let Some(fee) = config.fee {
        crate::validators::validate_fee(fee)?;
        state.config.fee = fee;
    }
    if let Some(fee_receiver) = config.fee_receiver {
        state.config.fee_receiver = deps.api.addr_validate(&fee_receiver)?;
    }
    if let Some(public_listing_fee) = config.public_listing_fee {
        state.config.public_listing_fee = public_listing_fee;
    }
    if let Some(public_listing_fee_receiver) = config.public_listing_fee_receiver {
        state.config.public_listing_fee_receiver =
            deps.api.addr_validate(&public_listing_fee_receiver)?;
    }

    // Save config.
    STATE.save(deps.storage, &state)?;

    Ok(Response::default()
        .add_attribute("method", "update")
        .add_attribute("owner", state.owner.to_string())
        .add_attribute("fee", state.config.fee.to_string())
        .add_attribute("fee_receiver", state.config.fee_receiver.to_string())
        .add_attribute(
            "public_listing_fee",
            format!(
                "{}{}",
                state.config.public_listing_fee.amount, state.config.public_listing_fee.denom
            ),
        )
        .add_attribute(
            "public_listing_fee_receiver",
            state.config.public_listing_fee_receiver.to_string(),
        ))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetConfig {} => to_binary(&query_get_config(deps)?),
    }
}

fn query_get_config(deps: Deps) -> StdResult<ConfigResponse> {
    let state = STATE.load(deps.storage)?;
    Ok(ConfigResponse {
        config: state.config,
    })
}
