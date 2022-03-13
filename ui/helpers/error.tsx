import { TimeoutError } from "@cosmjs/stargate"
import * as Sentry from "@sentry/nextjs"
import { ReactNode } from "react"

import { TxnPollTimeoutError } from "@/components"

export enum CommonError {
  RequestRejected = "Wallet rejected transaction.",
  InvalidAddress = "Invalid address.",
  InsufficientFunds = "Insufficient funds.",
  GetClientFailed = "Failed to get client. Try refreshing the page or reconnecting your wallet.",
  Network = "Network error. Ensure you are connected to the internet, refresh the page, or try again later. If your network is working, the blockchain nodes may be having problems.",
  Unauthorized = "Unauthorized.",
  InsufficientForProposalDeposit = "Insufficient unstaked governance tokens. Ensure you have enough unstaked governance tokens on DAO DAO to pay for the proposal deposit.",
  PendingTransaction = "You have another pending transaction. Please try again in a minute or so.",
  CampaignNotOpen = "This campaign is not open, so it cannot accept or return funds.",
  NotFound = "Not found.",
  TextEncodingError = "Text encoding error.",
  AlreadyFunded = "This campaign is already funded and cannot receive more funding. You may need to refresh the page if the information is out of sync.",
  TxnSentTimeout = "Transaction sent but has not yet been detected. Refresh this page to view its changes or check back later.",
  InvalidJSONResponse = "Invalid JSON response from server.",
}

// Whether or not to send the error to Sentry. Some errors we want to clean up for the user but still investigate (e.g. InvalidJSONResponse), so let's send them to Sentry even if we recognize them.
const captureCommonErrorMap: Record<CommonError, boolean> = {
  [CommonError.RequestRejected]: false,
  [CommonError.InvalidAddress]: false,
  [CommonError.InsufficientFunds]: false,
  [CommonError.GetClientFailed]: false,
  [CommonError.Network]: false,
  [CommonError.Unauthorized]: false,
  [CommonError.InsufficientForProposalDeposit]: false,
  [CommonError.PendingTransaction]: false,
  [CommonError.CampaignNotOpen]: false,
  [CommonError.NotFound]: false,
  [CommonError.TextEncodingError]: false,
  [CommonError.AlreadyFunded]: false,
  [CommonError.TxnSentTimeout]: false,
  [CommonError.InvalidJSONResponse]: true,
}

type ParseErrorExtra = Record<string, unknown>
type ParseErrorMap = Partial<Record<CommonError, ReactNode>>

// Overload return based on includeTimeoutError.
interface ParseError {
  (
    error: Error | any,
    tags: ErrorTags,
    extra: ParseErrorExtra | undefined,
    map: ParseErrorMap | undefined,
    includeTimeoutError: true,
    overrideCapture?: Partial<Record<CommonError, boolean>>
  ): ReactNode
  (
    error: Error | any,
    tags: ErrorTags,
    extra?: ParseErrorExtra,
    map?: ParseErrorMap,
    includeTimeoutError?: false,
    overrideCapture?: Partial<Record<CommonError, boolean>>
  ): string
}

// Passing a map will allow common errors to be mapped to a custom error message for the given context.
export const parseError: ParseError = (
  error: Error | any,
  tags: ErrorTags,
  extra?: Record<string, unknown> | undefined,
  map?: Partial<Record<CommonError, ReactNode>>,
  includeTimeoutError: boolean = false,
  overrideCapture?: Partial<Record<CommonError, boolean>>
) => {
  // Convert to error type.
  if (!(error instanceof Error)) {
    error = new Error(`${error}`)
  }

  // Special handling for TimeoutError.
  if (includeTimeoutError && error instanceof TimeoutError) {
    return <TxnPollTimeoutError transactionId={error.txId} />
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
    message.includes("socket hang up") ||
    message.includes("Bad status on response: 5") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("panic: invalid request")
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
  } else if (
    message.includes("invalid json response body") ||
    message.includes("Unexpected token < in JSON")
  ) {
    recognizedError = CommonError.InvalidJSONResponse
  } else if (
    message.includes(
      "Cannot encode character that is out of printable ASCII range"
    )
  ) {
    recognizedError = CommonError.TextEncodingError
  } else if (message.includes("Funding overflow")) {
    recognizedError = CommonError.AlreadyFunded
  } else if (
    message.includes("was submitted but was not yet found on the chain")
  ) {
    recognizedError = CommonError.TxnSentTimeout
  }

  // If recognized error, try to find it in the map, or else return the recognized error.
  if (recognizedError) {
    // Sent to Sentry if we want to capture this recognized error.
    const shouldCapture =
      (overrideCapture && overrideCapture[recognizedError]) ??
      captureCommonErrorMap[recognizedError]
    if (shouldCapture) {
      Sentry.captureException(error, { tags, extra })
    }

    return ((map && map[recognizedError]) || recognizedError) as string
  }

  // Send to Sentry since we were not expecting it.
  Sentry.captureException(error, { tags, extra })

  // If no recognized error, return error message by default.
  return message
}
