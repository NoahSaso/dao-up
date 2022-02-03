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

  interface WalletState {
    connected: boolean
    address: string
  }

  interface SetLoadingProps {
    setLoading: (loading: boolean) => void
  }
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
