import { TimeoutError } from "@cosmjs/stargate"
import * as Sentry from "@sentry/nextjs"
import { ReactNode } from "react"

import { TxnPollTimeoutError } from "@/components"

// To add a new error:
// 1. Add a value to this enum.
// 2. Add matching parameters in commonErrorPatterns below.
// 3. Set if the error should be sent to Sentry or not in captureCommonErrorMap below.
export enum CommonError {
  RequestRejected = "Wallet rejected transaction.",
  InvalidAddress = "Invalid address.",
  InsufficientFees = "Insufficient fees. Reconnect your wallet, ensure you're on the right chain, and try again.",
  InsufficientFunds = "Insufficient funds.",
  GetClientFailed = "Failed to get client. Try refreshing the page or reconnecting your wallet.",
  Network = "Network error. Ensure you are connected to the internet, refresh the page, or try again later. If your network is working, the blockchain nodes may be having problems.",
  Unauthorized = "Unauthorized.",
  InsufficientForProposalDeposit = "Insufficient unstaked governance tokens. Ensure you have enough unstaked governance tokens on DAO DAO to pay for the proposal deposit.",
  PendingTransaction = "You have another pending transaction. Please try again in a minute or so.",
  CampaignNotOpen = "This campaign is not open, so it cannot accept or return funds.",
  NotFound = "Not found.",
  TextEncodingDecodingError = "Text encoding/decoding error. Invalid character present in text.",
  AlreadyFunded = "This campaign is already funded and cannot receive more funding. You may need to refresh the page if the information is out of sync.",
  TxnSentTimeout = "Transaction sent but has not yet been detected. Refresh this page to view its changes or check back later.",
  InvalidJSONResponse = "Invalid JSON response from server.",
  NodeFailure = "The blockchain nodes seem to be having problems. Try again later.",
  BlockHeightTooLow = "Block height is too low.",
  TxPageOutOfRange = "Transaction page is out of range.",
}

// List of error substrings to match to determine the common error.
// Elements in value are OR'd together. Inner string arrays are AND'd together.
// For example: ["abc", "def"] matches "abc" or "def" or "abc def".
// For example: ["abc", ["def", "ghi"]] matches "abc def ghi" or "def ghi" but NOT "abc def" or "abc ghi".
const commonErrorPatterns: Record<CommonError, (string | string[])[]> = {
  [CommonError.RequestRejected]: ["Request rejected"],
  [CommonError.InvalidAddress]: [
    "decoding bech32 failed: invalid checksum",
    "contract: not found",
    // Provided non-DAO address where a DAO address was expected.
    "unknown variant `get_config`",
    // Provided non-campaign address where a campaign address was expected.
    "unknown variant `dump_state`",
  ],
  [CommonError.InsufficientFees]: ["insufficient fees"],
  [CommonError.InsufficientFunds]: [
    "insufficient funds",
    // Try to send money with no balance.
    "Account does not exist on chain.",
    ["fee payer address", "does not exist"],
  ],
  [CommonError.GetClientFailed]: [
    "Bad status on response: 403",
    "Failed to retrieve account from signer",
  ],
  [CommonError.Network]: [
    "Failed to fetch",
    "socket disconnected",
    "socket hang up",
    "Bad status on response: 5",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "panic: invalid request",
    "tx already exists in cache",
  ],
  [CommonError.Unauthorized]: ["Unauthorized"],
  [CommonError.InsufficientForProposalDeposit]: ["Overflow: Cannot Sub with"],
  [CommonError.PendingTransaction]: ["account sequence mismatch"],
  [CommonError.CampaignNotOpen]: ["Campaign is not open and accepting funds"],
  [CommonError.NotFound]: ["not found"],
  [CommonError.TextEncodingDecodingError]: ["out of printable ASCII range"],
  [CommonError.AlreadyFunded]: ["Funding overflow"],
  [CommonError.TxnSentTimeout]: [
    "was submitted but was not yet found on the chain",
  ],
  [CommonError.InvalidJSONResponse]: [
    "invalid json response body",
    "Unexpected token < in JSON",
  ],
  [CommonError.NodeFailure]: ["goroutine"],
  [CommonError.BlockHeightTooLow]: [
    ["-32603", "not available", "lowest height is"],
  ],
  [CommonError.TxPageOutOfRange]: [
    ["-32603", "page should be within", "range", "given"],
  ],
}
const commonErrorPatternsEntries = Object.entries(commonErrorPatterns) as [
  CommonError,
  (string | string[])[]
][]

// Whether or not to send the error to Sentry. Some errors we want to clean up for the user but still investigate (e.g. InvalidJSONResponse), so let's send them to Sentry even if we recognize them.
const captureCommonErrorMap: Record<CommonError, boolean> = {
  [CommonError.RequestRejected]: false,
  [CommonError.InvalidAddress]: false,
  [CommonError.InsufficientFees]: false,
  [CommonError.InsufficientFunds]: false,
  [CommonError.GetClientFailed]: false,
  [CommonError.Network]: false,
  [CommonError.Unauthorized]: false,
  [CommonError.InsufficientForProposalDeposit]: false,
  [CommonError.PendingTransaction]: false,
  [CommonError.CampaignNotOpen]: false,
  [CommonError.NotFound]: false,
  [CommonError.TextEncodingDecodingError]: false,
  [CommonError.AlreadyFunded]: false,
  [CommonError.TxnSentTimeout]: false,
  [CommonError.InvalidJSONResponse]: true,
  [CommonError.NodeFailure]: false,
  [CommonError.BlockHeightTooLow]: false,
  // TODO: Find out why this keeps happening and stop capturing it.
  [CommonError.TxPageOutOfRange]: true,
}

type ParseErrorExtra = Record<string, unknown>
type ParseErrorTransform = Partial<Record<CommonError, ReactNode>>

// Overload return based on includeTimeoutError.
interface ParseError {
  (
    error: Error | any,
    tags: ErrorTags,
    options: {
      extra?: ParseErrorExtra
      transform?: ParseErrorTransform
      includeTimeoutError: true
      overrideCapture?: Partial<Record<CommonError, boolean>>
    }
  ): ReactNode
  (
    error: Error | any,
    tags: ErrorTags,
    options?: {
      extra?: ParseErrorExtra
      transform?: ParseErrorTransform
      includeTimeoutError?: false
      overrideCapture?: Partial<Record<CommonError, boolean>>
    }
  ): string
}

// Passing a map will allow common errors to be mapped to a custom error message for the given context.
export const parseError: ParseError = (
  error,
  tags,
  { extra, transform, includeTimeoutError = false, overrideCapture } = {}
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
  for (const [commonError, patterns] of commonErrorPatternsEntries) {
    // Match if any elements are matches.
    const match = patterns.some((pattern) =>
      Array.isArray(pattern)
        ? // If array of strings, every element must match.
          pattern.every((p) => message.includes(p))
        : message.includes(pattern)
    )
    // If recognized error, break.
    if (match) {
      recognizedError = commonError
      break
    }
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

    return ((transform && transform[recognizedError]) ||
      recognizedError) as string
  }

  // Send to Sentry since we were not expecting it.
  Sentry.captureException(error, { tags, extra })

  // If no recognized error, return error message by default.
  return message
}
