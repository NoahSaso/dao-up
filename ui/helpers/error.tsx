import { TimeoutError } from "@cosmjs/stargate"
import * as Sentry from "@sentry/nextjs"
import { ReactNode } from "react"

import { TxnPollTimeoutError } from "@/components"

export enum CommonError {
  RequestRejected = "Wallet rejected transaction.",
  InvalidAddress = "Invalid address.",
  InsufficientFunds = "Insufficient funds.",
  GetClientFailed = "Failed to get client. Try refreshing the page or reconnecting your wallet.",
  Network = "Network error. Ensure you are connected to the internet, refresh the page, or try again later.",
  Unauthorized = "Unauthorized.",
  InsufficientForProposalDeposit = "Insufficient unstaked governance tokens. Ensure you have enough unstaked governance tokens on DAO DAO to pay for the proposal deposit.",
  PendingTransaction = "You have another pending transaction. Please try again in a minute or so.",
  CampaignNotOpen = "This campaign is not open, so it cannot accept or return funds.",
  NotFound = "Not found.",
  UnknownError = "Unknown error.",
  TextEncodingError = "Text encoding error.",
  AlreadyFunded = "This campaign is already funded and cannot receive more funding. You may need to refresh the page if the information is out of sync.",
  TxnSentTimeout = "Transaction sent but has not yet been detected. Refresh this page to view its changes or check back later.",
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
    includeTimeoutError: true
  ): ReactNode
  (
    error: Error | any,
    tags: ErrorTags,
    extra?: ParseErrorExtra,
    map?: ParseErrorMap,
    includeTimeoutError?: false
  ): string
}

// Passing a map will allow common errors to be mapped to a custom error message for the given context.
export const parseError: ParseError = (
  error: Error | any,
  tags: ErrorTags,
  extra?: Record<string, unknown> | undefined,
  map?: Partial<Record<CommonError, ReactNode>>,
  includeTimeoutError?: boolean
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
    message.includes("Bad status on response: 502") ||
    message.includes("Bad status on response: 522") ||
    message.includes("ECONNREFUSED")
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
    message.includes("Bad status on response: 520") ||
    message.includes("Bad status on response: 500")
  ) {
    recognizedError = CommonError.UnknownError
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
    return ((map && map[recognizedError]) || recognizedError) as string
  }

  // Send to Sentry since we were not expecting it.
  Sentry.captureException(error, { tags, extra })

  // If no recognized error, return error message by default.
  return message
}
