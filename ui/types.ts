import { Window as KeplrWindow } from "@keplr-wallet/types"
import { ReactNode } from "react"
import { SetterOrUpdater } from "recoil"

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
    daoUrl: string
    tokenPrice: number
    supporters: number
    pledged: number
    supply: number
    tokenName: string
    tokenSymbol: string
    activity: ActivityItem[]
  }

  interface NewCampaign {
    name: string
    description: string
    imageUrl?: string
    goal: number
    daoAddress: string
    displayPublicly: boolean

    website?: string
    twitter?: string
    discord?: string
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

  interface SetLoadingProps {
    setLoading: (loading: boolean) => void
  }

  interface MyCampaigns {
    creatorCampaigns: Campaign[]
    contributorCampaigns: Campaign[]
  }

  // State

  interface WalletState {
    connected: boolean
    address: string
  }
  type SetWalletFunction = SetterOrUpdater<WalletState>
}

export enum Status {
  Pending,
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
