use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Coin, Decimal};
use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Campaign {
    pub name: String,
    pub description: String,

    pub website: Option<String>,
    pub twitter: Option<String>,
    pub discord: Option<String>,
    pub image_url: Option<String>,

    pub hidden: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    /// The contract has been instantiated and is pending funding from
    /// the DAO.
    Pending {},
    /// The contract has received governance tokens from the DAO and
    /// is accepting funding.
    Open {
        /// The token price in number of tokens per native token
        /// (ex. uJuno).
        token_price: Decimal,
    },
    /// The DAO has closed the campaign. Refunds are avaliable but no
    /// new funds may be added.
    Closed { token_price: Decimal },
    /// The campaign has met its funding goal. Tokens may now be
    /// exchanged for governance tokens in the DAO.
    Complete { token_price: Decimal },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub status: Status,

    pub dao_addr: Addr,
    pub creator: Addr,

    pub funding_goal: Coin,
    pub funds_raised: Coin,

    pub campaign_info: Campaign,
}

pub const STATE: Item<State> = Item::new("state");

pub const GOV_TOKEN_ADDR: Item<Addr> = Item::new("gov_token_addr");
pub const FUNDING_TOKEN_ADDR: Item<Addr> = Item::new("funding_token_addr");
