import { Window as KeplrWindow } from "@keplr-wallet/types"

declare global {
  interface Window extends KeplrWindow {}

  interface ActivityItem {
    when: Date
    address: string
    amount: number
    asset: string
  }

  interface Campaign {
    id: string
    name: string
    description: string
    imageUrl?: string
    open: boolean
    daoUrl?: string

    website?: string
    twitter?: string
    discord?: string

    asset: string
    goal: number
    pledged: number
    supporters: number
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
    initialDistributionAddress?: string
    initialDistributionAmount: number
    votingDuration: number
    unstakingDuration: number
    proposalDeposit: number
    refundProposalDeposits: boolean
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

export enum Color {
  Green = "green",
  Orange = "orange",
  Light = "light",
  Placeholder = "placeholder",
}

export type ColorType = `${Color}`
