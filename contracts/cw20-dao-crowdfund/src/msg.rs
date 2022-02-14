use cosmwasm_std::{Addr, Coin, Decimal};
use cw20::Cw20ReceiveMsg;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::state::{Campaign, Status};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    /// The address of the DAO that is fundraising.
    pub dao_address: Addr,
    /// The code ID that is expected for DAO contract. If
    /// `dao_address` was not instantiated from this code ID
    /// instantiation will fail.
    pub expected_dao_code_id: u64,

    /// Code ID for the cw20 contract we should use for the
    /// fundraising token.
    pub cw20_code_id: u64,

    /// The contract which will receive the fee when the campaign is
    /// created.
    pub fee_receiver: Addr,
    /// The percentage of funds that should be sent to the fee
    /// receiver on campaign completion. Fees are deducted when
    /// funding tokens are exchanged for gov tokens.
    pub fee: Decimal,

    pub funding_goal: Coin,
    pub funding_token_name: String,
    pub funding_token_symbol: String,

    pub campaign_info: Campaign,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    /// Deposits funds to the contract and mints tokens for the
    /// sender. Can only be executed if the campaign is not closed.
    Fund {},
    /// Used for issuing refunds, swaping to governance tokens, and
    /// the initial funding of the contract by the DAO.
    ///
    /// Sending funding tokens to the contract will execute a refund
    /// if the campaign is open. If the campaign is closed it will
    /// give staked governance tokens to the sender.
    ///
    /// Sending governance tokens to the contract will seed the
    /// contract and put it in an open state. The DAO must do this
    /// before the campaign can begin.
    Receive(Cw20ReceiveMsg),
    /// Closes the campaign and returns governance tokens to the
    /// DAO. Refunds are still accepted but funding is no longer
    /// possible.
    Close {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    /// Gets the address of the DAO governance token. Returns Addr.
    GovTokenAddr {},
    /// Gets the address of the funding token. Returns Addr.
    FundingTokenAddr {},
    /// Gets the status of the campaign. Returns Status.
    Status {},
    /// Gets the amount of funds raised. This must be used instead of
    /// querying the bank module about this contract's balance.
    FundsRaised {},
    /// Dumps the contracts state. Returns DumpStateResponse.
    DumpState {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct DumpStateResponse {
    pub status: Status,
    pub dao_addr: Addr,
    pub creator: Addr,
    pub funding_goal: Coin,
    pub funds_raised: Coin,
    pub funding_token_info: cw20::TokenInfoResponse,
    pub gov_token_info: cw20::TokenInfoResponse,
    pub campaign_info: Campaign,
    pub gov_token_addr: Addr,
    pub funding_token_addr: Addr,
    pub fee_receiver: Addr,
    pub fee: Decimal,
}
