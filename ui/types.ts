import { Window as KeplrWindow } from "@keplr-wallet/types"
import { ReactNode } from "react"

declare global {
  interface Window extends KeplrWindow {}

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
    imageUrl?: string

    status: Status
    creator: string
    hidden: boolean

    goal: number
    pledged: number
    // TODO: Figure out how best to retrieve this.
    // supporters: number

    dao: {
      address: string
      url: string
      govToken: {
        address: string
      }
    }

    fundingToken: {
      address: string
      // fundingToken/JUNO
      price?: number
      name: string
      symbol: string
      supply: number
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
  }

  interface NewCampaignField {
    label: string
    pageId: number
    required: boolean
    render: (v: any, c: Partial<NewCampaign>) => ReactNode
    unitBefore?: (c: Partial<NewCampaign>) => string
    unitAfter?: (c: Partial<NewCampaign>) => string
  }

  type NewCampaignFieldKey = keyof NewCampaign

  // Selectors

  type AsyncSelectorResponse<T> = T & {
    error: string | null
  }

  type CampaignStateResponse = AsyncSelectorResponse<{
    // TODO: Type accurately.
    state: any | null
  }>

  type CampaignResponse = AsyncSelectorResponse<{ campaign: Campaign | null }>

  type TokenInfoResponse = AsyncSelectorResponse<{
    info: {
      decimals: number
      name: string
      symbol: string
      total_supply: number
      [k: string]: unknown
    } | null
  }>

  type CampaignWalletBalanceResponse = AsyncSelectorResponse<{
    balance: number | null
  }>

  type EscrowContractAddressesResponse = AsyncSelectorResponse<{
    addresses: readonly string[]
  }>

  type CampaignActionsResponse = AsyncSelectorResponse<{
    actions: CampaignAction[] | null
  }>
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

export enum CampaignActionType {
  Fund = "fund",
  Refund = "refund",
}

export type ColorType = `${Color}`
