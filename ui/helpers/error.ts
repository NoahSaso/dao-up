import * as Sentry from "@sentry/nextjs"

import { CommonError } from "./../types"

// Passing a map will allow common errors to be mapped to a custom error message for the given context.
export const parseError = (
  error: Error | any,
  map?: Partial<Record<CommonError, string>>
) => {
  if (!(error instanceof Error)) {
    Sentry.captureException(new Error(`${error}`))
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
    // Provided token address where a DAO address was expected.
    (message.includes("cw20_base") &&
      message.includes("unknown variant `get_config`"))
  ) {
    recognizedError = CommonError.InvalidAddress
  } else if (message.includes("Failed to fetch")) {
    recognizedError = CommonError.Network
  }

  // If recognized error, try to find it in the map, or else return the recognized error.
  if (recognizedError) {
    return (map && map[recognizedError]) || recognizedError
  }

  // Send to Sentry since we were not expecting it.
  Sentry.captureException(error)

  // If no recognized error, return default error message.
  return message
}
