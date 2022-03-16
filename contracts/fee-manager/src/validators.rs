use cosmwasm_std::{Addr, Decimal, DepsMut};

use crate::ContractError;

pub fn validate_config(
    deps: &DepsMut,
    receiver_address: &str,
    fee: Decimal,
) -> Result<Addr, ContractError> {
    // Validate receiver address.
    let receiver_addr = deps.api.addr_validate(receiver_address)?;

    // Verify fee percent is between 0 and 100.
    if fee < Decimal::percent(0) {
        return Err(ContractError::InvalidFee(format!(
            "fee ({}) is less than 0%",
            fee
        )));
    }
    if fee > Decimal::percent(100) {
        return Err(ContractError::InvalidFee(format!(
            "fee ({}) is greater than 100%",
            fee
        )));
    }

    Ok(receiver_addr)
}
