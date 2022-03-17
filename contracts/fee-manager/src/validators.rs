use cosmwasm_std::Decimal;

use crate::ContractError;

pub fn validate_fee(fee: Decimal) -> Result<(), ContractError> {
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

    Ok(())
}
