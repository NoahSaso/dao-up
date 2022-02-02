use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Instantiation error: ({0})")]
    Instantiation(String),

    #[error("Got a submessage reply with unknown id: {id}")]
    UnknownReplyId { id: u64 },

    #[error("The campaign is no longer active.")]
    Innactive {},

    #[error("Campaign can only be closed if funding goal is met and it is active")]
    Close {},

    #[error("Transfer can only be executed if the campaign is closed")]
    Transfer {},
}
