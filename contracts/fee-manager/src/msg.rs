use cosmwasm_std::{Coin, Decimal};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::state::Config;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub fee: Decimal,
    pub fee_receiver: String,

    pub public_listing_fee: Coin,
    pub public_listing_fee_receiver: String,
}

// EXECUTE

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Update { config: ConfigUpdate },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ConfigUpdate {
    pub fee: Option<Decimal>,
    pub fee_receiver: Option<String>,

    pub public_listing_fee: Option<Coin>,
    pub public_listing_fee_receiver: Option<String>,
}

// QUERY

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    // GetConfig returns the config of the fee manager.
    GetConfig {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ConfigResponse {
    pub config: Config,
}
