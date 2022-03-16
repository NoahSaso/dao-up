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
    let receiver_addr = crate::validators::validate_config(&deps, &msg.receiver_address, msg.fee)?;

    let state = State {
        owner: info.sender.clone(),
        config: Config {
            receiver_addr: receiver_addr.clone(),
            fee: msg.fee,
            public_listing_fee: msg.public_listing_fee.clone(),
        },
    };
    STATE.save(deps.storage, &state)?;

    Ok(Response::default()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", state.owner.to_string())
        .add_attribute("receiver", state.config.receiver_addr.to_string())
        .add_attribute("fee", state.config.fee.to_string())
        .add_attribute(
            "public_listing_fee",
            format!(
                "{}{}",
                state.config.public_listing_fee.amount, state.config.public_listing_fee.denom
            ),
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

    // Validate config.
    let receiver_addr = crate::validators::validate_config(
        &deps,
        &config
            .receiver_address
            .unwrap_or_else(|| state.config.receiver_addr.to_string()),
        config.fee.unwrap_or_else(|| state.config.fee),
    )?;

    // Update config.
    state.config = Config {
        receiver_addr,
        fee: config.fee.unwrap_or_else(|| state.config.fee),
        public_listing_fee: config
            .public_listing_fee
            .unwrap_or_else(|| state.config.public_listing_fee.clone()),
    };
    STATE.save(deps.storage, &state)?;

    Ok(Response::default()
        .add_attribute("method", "update")
        .add_attribute("owner", state.owner.to_string())
        .add_attribute("receiver", state.config.receiver_addr.to_string())
        .add_attribute("fee", state.config.fee.to_string())
        .add_attribute(
            "public_listing_fee",
            format!(
                "{}{}",
                state.config.public_listing_fee.amount, state.config.public_listing_fee.denom
            ),
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
