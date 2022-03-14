use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Coin, Decimal, Uint128};
use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Campaign {
    pub name: String,
    pub description: String,

    pub website: Option<String>,
    pub twitter: Option<String>,
    pub discord: Option<String>,
    /// The image URL used as the campaign's profile photo.
    pub profile_image_url: Option<String>,
    /// The image URLs displayed with the campaign's description.
    pub description_image_urls: Vec<String>,

    pub hidden: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    /// The contract has been instantiated but its funding token has
    /// not been instantiated. No actions can be performed on the
    /// contract.
    Uninstantiated {},
    /// The contract has been instantiated and is pending funding from
    /// the DAO.
    Pending {},
    /// The contract has received governance tokens from the DAO and
    /// is accepting funding.
    Open {
        /// The token price in number of tokens per native token
        /// (ex. uJuno).
        token_price: Decimal,
        initial_gov_token_balance: Uint128,
    },
    /// The DAO has closed the campaign. Refunds are avaliable but no
    /// new funds may be added.
    Cancelled {
        token_price: Decimal,
        initial_gov_token_balance: Uint128,
    },
    /// The campaign has met its funding goal. Tokens may now be
    /// exchanged for governance tokens in the DAO.
    Funded {
        token_price: Decimal,
        initial_gov_token_balance: Uint128,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub status: Status,

    pub dao_addr: Addr,
    pub fee_manager_addr: Addr,
    pub creator: Addr,

    pub funding_goal: Coin,
    pub funds_raised: Coin,

    pub campaign_info: Campaign,
}

pub const STATE: Item<State> = Item::new("state");

pub const GOV_TOKEN_ADDR: Item<Addr> = Item::new("gov_token_addr");
pub const FUNDING_TOKEN_ADDR: Item<Addr> = Item::new("funding_token_addr");

// TODO: move to other contract code
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct FeeManagerState {
    pub receiver_addr: Addr,
    pub fee_percent: Decimal,
    pub public_listing_fee: Coin,
}
