use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Coin, Decimal};
use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub fee: Decimal,
    pub fee_receiver: Addr,

    pub public_listing_fee: Coin,
    pub public_listing_fee_receiver: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub owner: Addr,
    pub config: Config,
}

pub const STATE: Item<State> = Item::new("state");
