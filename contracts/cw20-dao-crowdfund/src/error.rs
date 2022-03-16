use cosmwasm_std::{Decimal, StdError};
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Got a submessage reply with unknown id: {id}")]
    UnknownReplyId { id: u64 },

    #[error("Instantiation error: ({0})")]
    Instantiation(String),

    #[error("Campaign is not open and accepting funds")]
    NotOpen {},

    #[error("Campaign is not pending and accepting gov tokens")]
    NotPending {},

    #[error("Campaign has been closed by the DAO. You can still receive a refund.")]
    Closed {},

    #[error("Funding overflow. A campaign can't be funded past its funding goal.")]
    FundingOverflow {},

    #[error("Contribution amount is too small to receive any gov tokens. Gov token price: ({token_price}) tokens/juno")]
    SmallContribution { token_price: Decimal },

    #[error("Refund token amount too small. Would result in a refund of zero. Must refund at least ({token_price}) tokens.")]
    SmallRefund { token_price: Decimal },

    #[error("Only open campaigns can be closed.")]
    InvalidClose {},

    #[error("Too few gov tokens sent. This would result in a funding token price of zero.")]
    InvalidGovTokenAmount {},

    #[error("Invalid public payment: {0}.")]
    InvalidPublicPayment(String),

    #[error("Invalid fee manager address.")]
    InvalidFeeManager,
}
