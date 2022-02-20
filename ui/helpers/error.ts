import * as Sentry from "@sentry/nextjs"

import { CommonError } from "./../types"

// Passing a map will allow common errors to be mapped to a custom error message for the given context.
export const parseError = (
  error: Error | any,
  context: ErrorContext,
  map?: Partial<Record<CommonError, string>>
) => {
  if (!(error instanceof Error)) {
    Sentry.captureException(new Error(`${error}`), { extra: context })
    return `${error}`
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
    message.includes("unknown variant `get_config`")
  ) {
    recognizedError = CommonError.InvalidAddress
  } else if (message.includes("Failed to fetch")) {
    recognizedError = CommonError.Network
  } else if (message.includes("Unauthorized")) {
    recognizedError = CommonError.Unauthorized
  } else if (message.includes("Overflow: Cannot Sub with")) {
    recognizedError = CommonError.InsufficientForProposalDeposit
  } else if (message.includes("account sequence mismatch")) {
    recognizedError = CommonError.PendingTransaction
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
