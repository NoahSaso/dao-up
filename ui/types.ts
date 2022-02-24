import { Window as KeplrWindow } from "@keplr-wallet/types"

declare global {
  interface Window extends KeplrWindow {}

  interface CampaignProps {
    campaign: Campaign
    className?: string
  }

  interface CampaignAction {
    type: CampaignActionType
    address: string
    amount: number
    when?: Date
  }

  interface Campaign {
    address: string
    name: string
    description: string
    urlPath: string
    imageUrl?: string
    imageUrls?: string[]

    status: Status
    creator: string
    hidden: boolean
    featured: boolean

    goal: number
    pledged: number
    // TODO: Figure out how best to retrieve this.
    // backers: number

    dao: {
      address: string
      url: string
    }

    govToken: {
      address: string
      name: string
      symbol: string
      campaignBalance: number
      daoBalance: number
      supply: number
    }

    fundingToken: {
      address: string
      // fundingToken/JUNO
      price?: number
      supply?: number
      name: string
      symbol: string
    }

    website?: string
    twitter?: string
    discord?: string
  }

  interface NewCampaign {
    name: string
    description: string
    hidden: boolean

    goal: number
    daoAddress: string
    tokenName: string
    tokenSymbol: string

    website?: string
    twitter?: string
    discord?: string
    imageUrl?: string
    imageUrls?: string[]
  }

  interface PageInfo {
    startIndex: number
    endIndex: number
    // So this interface can be used as a Recoil selectorFamily argument type...
    [key: string]: number
  }

  interface ErrorContext extends Record<string, unknown> {
    source: string
    campaign?: string
    wallet?: string
    token?: string
    amount?: number
  }

  type DENSAddressMap = Record<string, string | undefined>

  // Selectors

  type AsyncSelectorResponse<T> = T & {
    error: string | null
  }

  type CampaignStateResponse = AsyncSelectorResponse<{
    // TODO: Type accurately.
    state: any | null
  }>

  type CampaignResponse = AsyncSelectorResponse<{ campaign: Campaign | null }>
  type CampaignsResponse = AsyncSelectorResponse<{
    campaigns: Campaign[] | null
    hasMore: boolean
  }>

  type TokenInfoResponse = AsyncSelectorResponse<{
    info: {
      decimals: number
      name: string
      symbol: string
      total_supply: number
      [k: string]: unknown
    } | null
  }>

  type TokenBalanceResponse = AsyncSelectorResponse<{
    balance: number | null
  }>

  type EscrowContractAddressesResponse = AsyncSelectorResponse<{
    addresses: string[]
  }>

  type CampaignActionsResponse = AsyncSelectorResponse<{
    actions: CampaignAction[] | null
  }>

  type DAOConfigResponse = AsyncSelectorResponse<{ config: any | null }>
  type DAOValidationResponse = AsyncSelectorResponse<{ valid: boolean }>

  interface AddressPriorityListItem {
    addr: string
    priority: number
  }

  interface AddressPriorityListResponse {
    members: AddressPriorityListItem[]
  }
}

export enum Status {
  Pending = "pending",
  Open = "open",
  Cancelled = "cancelled",
  Funded = "funded",
}

export enum Color {
  Green = "green",
  Orange = "orange",
  Light = "light",
  Placeholder = "placeholder",
}

export type ColorType = `${Color}`

export enum CampaignActionType {
  Fund = "fund",
  Refund = "refund",
}

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
