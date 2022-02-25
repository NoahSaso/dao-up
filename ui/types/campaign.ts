declare global {
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

  // These are retrieved differently for different Campaign contract versions.
  interface VersionedCampaignFields {
    profileImageUrl?: string
    descriptionImageUrls: string[]
    govToken: {
      campaignBalance: number
    }
  }

  interface Campaign extends VersionedCampaignFields {
    version: CampaignContractVersion

    address: string
    name: string
    description: string
    urlPath: string
    profileImageUrl?: string
    descriptionImageUrls: string[]

    status: CampaignStatus
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
    profileImageUrl?: string

    descriptionImageUrls: string[]
    // Optional so it can be deleted.
    _descriptionImageUrls?: { url: string }[]
  }

  type DENSAddressMap = Record<string, string | undefined>
}

export enum CampaignContractVersion {
  v1 = "0.1.0",
  v2 = "0.2.0",
}

export enum CampaignStatus {
  Pending = "pending",
  Open = "open",
  Cancelled = "cancelled",
  Funded = "funded",
}

export type CampaignVersionedStatus<
  V extends CampaignContractVersion,
  S extends CampaignStatus
> = V extends CampaignContractVersion.v1
  ? S extends CampaignStatus.Pending
    ? {}
    : {
        token_price: string
      }
  : V extends CampaignContractVersion.v2
  ? S extends CampaignStatus.Pending
    ? {}
    : {
        token_price: string
        initial_gov_token_balance: string
      }
  : {}

export enum CampaignActionType {
  Fund = "fund",
  Refund = "refund",
}
