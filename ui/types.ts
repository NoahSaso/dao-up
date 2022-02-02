import { Window as KeplrWindow } from "@keplr-wallet/types"

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
  }

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
