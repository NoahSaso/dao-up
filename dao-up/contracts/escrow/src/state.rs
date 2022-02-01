use cw_utils::Duration;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct DaoConfig {
    pub token_name: String,
    pub token_symbol: String,

    pub name: String,
    pub description: String,

    pub threshold: cw3_dao::msg::Threshold,
    pub max_voting_period: Duration,
    pub proposal_deposit_amount: Uint128,
    pub refund_failed_proposals: Option<bool>,

    pub unstaking_duration: Option<Duration>,

    pub image_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct Campaign {
    pub name: String,
    pub description: String,

    pub website: Option<String>,
    pub twitter: Option<String>,
    pub discord: Option<String>,
    pub image_url: Option<String>,

    pub dao_config: DaoConfig,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct State {
    /// The creator of the campaign.
    pub creator: Addr,
    /// The funding goal.
    pub funding_goal: Coin,
    /// The price of one token.
    pub token_price: Coin,
    /// Status of the escrow contract.
    pub status: Status,
    /// The configuration for the campaign.
    pub campaign: Campaign,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum Status {
    Active,
    ClosedButNotTransfered { dao_address: Addr },
    Closed { dao_address: Addr },
}

pub const STATE: Item<State> = Item::new("state");
// Address of the token that will be distributed.
pub const GOV_TOKEN_ADDR: Item<Addr> = Item::new("gov_token_addr");

// Code ID of the DAO contracts.
pub const DAO_CODE_ID: Item<u64> = Item::new("dao_code_id");
pub const STAKING_CODE_ID: Item<u64> = Item::new("staking_code_id");
