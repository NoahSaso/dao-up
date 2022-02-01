use cosmwasm_std::Coin;
use cw20::Cw20ReceiveMsg;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::{
    state::{Campaign, Status},
    ContractError,
};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    /// The funding goal.
    pub funding_goal: Coin,
    /// The price of one token.
    pub token_price: Coin,
    /// The code ID of the governance token.
    pub gov_token_code_id: u64,
    /// The code ID of the DAO contract.
    pub dao_contract_code_id: u64,
    /// The code ID of the staking contract to use with instantiated
    /// DAOs.
    pub staking_contract_code_id: u64,
    /// Information about the campaign.
    pub campaign_info: Campaign,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    /// Deposits for the contract and mints tokens for the sender. Can
    /// only be executed if the campaign is active.
    Fund {},
    /// Closes the funding campaign. Future fund messages will be
    /// rejected. Can only be executed if the funding goal has been
    /// reached.
    Close {},
    /// Transfers the contracts funds and minting control to the
    /// instantiated DAO. Can only be run if the campaign has been
    /// closed.
    Transfer {},
    /// Issues a refund and burns the sent tokens.
    Receive(Cw20ReceiveMsg),
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    /// Gets the creator of the campaign. Returns Uint128.
    Creator {},
    /// Gets the status of the campaign. Returns StatusResponse.
    Status {},
    /// Gets the address of the gov token for the contract. Returns Addr.
    GovToken {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct StatusResponse {
    pub status: Status,
    pub funds_raised: Coin,
    pub funding_goal: Coin,
}

impl InstantiateMsg {
    /// Validate that the instantiate message is reasonable.
    pub fn validate(&self) -> Result<(), ContractError> {
        if self.funding_goal.amount.is_zero() {
            return Err(ContractError::Instantiation(
                "funding goal is zero".to_string(),
            ));
        }
        if self.token_price.amount.is_zero() {
            return Err(ContractError::Instantiation(
                "token price is zero".to_string(),
            ));
        }
        if self.token_price.denom != self.funding_goal.denom {
            return Err(ContractError::Instantiation(format!(
                "funding goal and token price do not have same denom ({}, {})",
                self.funding_goal.denom, self.token_price.denom
            )));
        }

        return Ok(());
    }
}
