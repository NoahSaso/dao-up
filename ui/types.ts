import { Window as KeplrWindow } from "@keplr-wallet/types"
import { ReactNode } from "react"

declare global {
  interface Window extends KeplrWindow {}

  interface ActivityItem {
    when: Date
    address: string
    amount: number
  }

  interface Campaign extends NewCampaign {
    address: string
    status: Status
    creator: string
    daoUrl?: string
    tokenPrice: number
    supporters: number
    pledged: number
    supply: number
    activity: ActivityItem[]
  }

  interface NewCampaign {
    name: string
    description: string
    goal: number
    displayPublicly: boolean

    daoName: string
    daoDescription: string

    website?: string
    twitter?: string
    discord?: string
    imageUrl?: string

    tokenName: string
    tokenSymbol: string
    passingThreshold: number
    // advanced
    initialSupply: number
    initialDAOAmount: number
    initialDistributions?: InitialDistribution[]
    votingDuration: number
    unstakingDuration: number
    proposalDeposit: number
    refundProposalDeposits: boolean

    // custom errors
    totalDistributionAmountError?: string
  }

  interface InitialDistribution {
    address: string
    amount: number
  }

  interface NewCampaignField {
    label: string
    pageId: number
    required: boolean
    advanced: boolean
    render: (v: any, c: Partial<NewCampaign>) => ReactNode
    unitBefore?: (c: Partial<NewCampaign>) => string
    unitAfter?: (c: Partial<NewCampaign>) => string
  }

  type GlobalErrorNewCampaignFieldKey = "totalDistributionAmountError"
  type NonErrorNewCampaignFieldKey = Exclude<
    keyof NewCampaign,
    GlobalErrorNewCampaignFieldKey
  >

  interface WalletState {
    connected: boolean
    address: string
  }
}

export enum Status {
  Active,
  ClosedButNotTransferred,
  Closed,
}

export enum Color {
  Green = "green",
  Orange = "orange",
  Light = "light",
  Placeholder = "placeholder",
}

export type ColorType = `${Color}`
