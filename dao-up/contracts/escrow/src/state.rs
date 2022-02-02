use cw_utils::Duration;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_storage_plus::Item;

/// DAO Config information. This supports a _subset_ of all possible
/// DAO DAO DAOs as we enforce that an existing governance token is
/// used.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct DaoConfig {
    /// The name of the DAO's governance token.
    pub token_name: String,
    /// The symbol for the DAO's governance token.
    pub token_symbol: String,

    /// The name of the DAO.
    pub name: String,
    /// A description of the DAO.
    pub description: String,

    /// The passing threshold for DAO proposals.
    pub threshold: cw3_dao::msg::Threshold,
    /// The longest amount of time a proposal may be voted on before
    /// being closed.
    pub max_voting_period: Duration,
    /// The number of governance tokens that must be deposited in
    /// order to make a proposal.
    pub proposal_deposit_amount: Uint128,
    /// If failed proposals should still send back their proposal
    /// deposits. Enchorages good proposals.
    pub refund_failed_proposals: Option<bool>,

    /// The unstaking duration for the DAO's staking contract.
    pub unstaking_duration: Option<Duration>,

    /// A nice image that represents the DAO.
    pub image_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct Campaign {
    /// The name of the campaign.
    pub name: String,
    /// A description of the campaign.
    pub description: String,
    /// Rather or not the campaign would like to be listed in the 'all
    /// campains' view.
    pub visible: bool,

    pub website: Option<String>,
    pub twitter: Option<String>,
    pub discord: Option<String>,
    pub image_url: Option<String>,

    /// DAO config information for the DAO that will be instantiated.
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
    /// The initial token balance for the DAO.
    pub dao_initial_balance: Uint128,
    /// Status of the escrow contract.
    pub status: Status,
    /// The configuration for the campaign.
    pub campaign: Campaign,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum Status {
    /// The campaign is taking funds.
    Active,
    /// The campaing has been a closed, a DAO has been made, and funds
    /// have not been transfered there.
    ClosedButNotTransferred { dao_address: Addr },
    /// All is complete. Balance.
    Closed { dao_address: Addr },
}

pub const STATE: Item<State> = Item::new("state");
// Address of the token that will be distributed.
pub const GOV_TOKEN_ADDR: Item<Addr> = Item::new("gov_token_addr");

// Code ID of the DAO contracts.
pub const DAO_CODE_ID: Item<u64> = Item::new("dao_code_id");
pub const STAKING_CODE_ID: Item<u64> = Item::new("staking_code_id");
