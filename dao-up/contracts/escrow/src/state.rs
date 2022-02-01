use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Coin};
use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct DaoConfig {
    pub token_name: String,
    pub token_symbol: String,
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
pub const GOV_TOKEN: Item<Addr> = Item::new("gov_token");
