import * as Sentry from "@sentry/nextjs"

import { CommonError } from "./../types"

// Passing a map will allow common errors to be mapped to a custom error message for the given context.
export const parseError = (
  error: Error | any,
  context: ErrorContext,
  map?: Partial<Record<CommonError, string>>
) => {
  // Convert to error type.
  if (!(error instanceof Error)) {
    error = new Error(`${error}`)
  }

  const { message } = error
  let recognizedError

  // Attempt to recognize error.
  if (message.includes("Request rejected")) {
    recognizedError = CommonError.RequestRejected
  } else if (
    message.includes("insufficient funds") ||
    // Try to send money with no balance.
    message.includes("Account does not exist on chain.")
  ) {
    recognizedError = CommonError.InsufficientFunds
  } else if (
    message.includes("decoding bech32 failed: invalid checksum") ||
    message.includes("contract: not found") ||
    // Provided non-DAO address where a DAO address was expected.
    message.includes("unknown variant `get_config`") ||
    // Provided non-campaign address where a campaign address was expected.
    message.includes("unknown variant `dump_state`")
  ) {
    recognizedError = CommonError.InvalidAddress
  } else if (
    message.includes("Failed to fetch") ||
    message.includes("socket disconnected") ||
    message.includes("socket hang up")
  ) {
    recognizedError = CommonError.Network
  } else if (message.includes("Unauthorized")) {
    recognizedError = CommonError.Unauthorized
  } else if (message.includes("Overflow: Cannot Sub with")) {
    recognizedError = CommonError.InsufficientForProposalDeposit
  } else if (message.includes("account sequence mismatch")) {
    recognizedError = CommonError.PendingTransaction
  } else if (message.includes("Campaign is not open and accepting funds")) {
    recognizedError = CommonError.CampaignNotOpen
  } else if (message.includes("not found")) {
    recognizedError = CommonError.NotFound
  } else if (
    message.includes("Bad status on response: 403") ||
    message.includes("Failed to retrieve account from signer")
  ) {
    recognizedError = CommonError.GetClientFailed
  } else if (message.includes("Bad status on response: 520")) {
    recognizedError = CommonError.UnknownError
  } else if (
    message.includes(
      "Cannot encode character that is out of printable ASCII range"
    )
  ) {
    recognizedError = CommonError.TextEncodingError
  } else if (message.includes("Funding overflow")) {
    recognizedError = CommonError.AlreadyFunded
  }

  // If recognized error, try to find it in the map, or else return the recognized error.
  if (recognizedError) {
    return (map && map[recognizedError]) || recognizedError
  }

  // Send to Sentry since we were not expecting it.
  Sentry.captureException(error, { extra: context })

  // If no recognized error, return default error message.
  return message
}
