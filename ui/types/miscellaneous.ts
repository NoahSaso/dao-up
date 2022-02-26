declare global {
  // Iterates over union values and unions them.
  type ValuesOfUnion<T> = T extends T ? T[keyof T] : never

  interface ErrorContext extends Record<string, unknown> {
    source: string
    campaign?: string
    wallet?: string
    token?: string
    amount?: number
  }
}

export enum Color {
  Green = "green",
  Orange = "orange",
  Light = "light",
  Placeholder = "placeholder",
}

export type ColorType = `${Color}`

export enum CommonError {
  RequestRejected = "Wallet rejected transaction.",
  InvalidAddress = "Invalid address.",
  InsufficientFunds = "Insufficient funds.",
  GetClientFailed = "Failed to get client.",
  Network = "Network error. Ensure you are connected to the internet or try again later.",
  Unauthorized = "Unauthorized.",
  InsufficientForProposalDeposit = "Insufficient unstaked governance tokens. Ensure you have enough unstaked governance tokens on DAO DAO to pay for the proposal deposit.",
  PendingTransaction = "You have another pending transaction. Please try again in a minute or so.",
  CampaignNotOpen = "This campaign is not open, so it cannot accept or return funds.",
  NotFound = "Not found.",
}
