import { CommonError } from "./../types"

// Passing a map will allow common errors to be mapped to a custom error message for the given context.
export const parseError = (
  error: Error | any,
  map?: Partial<Record<CommonError, string>>
) => {
  if (!(error instanceof Error)) return `${error}`

  const { message } = error
  let recognizedError

  // Attempt to recognize error.
  if (message.includes("insufficient funds")) {
    recognizedError = CommonError.InsufficientFunds
  } else if (
    message.includes("decoding bech32 failed: invalid checksum") ||
    message.includes("contract: not found")
  ) {
    recognizedError = CommonError.InvalidAddress
  }

  // If recognized error, try to find it in the map, or else return the recognized error.
  if (recognizedError) {
    return (map && map[recognizedError]) || recognizedError
  }

  // If no recognized error, return default error message.
  return message
}
