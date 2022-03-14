declare global {
  interface CampaignProps {
    campaign: Campaign
    className?: string
  }

  interface CampaignAction {
    type: CampaignActionType
    address: string
    amount: number
    total?: number
    when?: Date
  }

  // These are retrieved differently for different Campaign contract versions.
  interface VersionedCampaignFields {
    feeManagerAddress: string | null
    profileImageUrl: string | null
    descriptionImageUrls: string[]
    govToken: {
      campaignBalance: number
    }
  }

  interface Campaign extends VersionedCampaignFields {
    version: CampaignContractVersion

    createdBlockHeight: number | null
    address: string
    name: string
    description: string
    urlPath: string
    profileImageUrl: string | null
    descriptionImageUrls: string[]

    status: CampaignStatus
    creator: string
    hidden: boolean
    featured: boolean

    payToken: PayToken
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
      price: number | null
      supply: number | null
      name: string
      symbol: string
    }

    website: string | null
    twitter: string | null
    discord: string | null
  }

  interface BaseCampaignInfo {
    name: string
    description: string
    hidden: boolean

    website?: string
    twitter?: string
    discord?: string
    profileImageUrl?: string

    descriptionImageUrls: string[]
    // Optional so it can be deleted.
    _descriptionImageUrls?: { url: string }[]
  }

  interface NewCampaignInfo extends BaseCampaignInfo {
    goal: number
    payTokenDenom: string
    daoAddress: string
    tokenName: string
    tokenSymbol: string
  }

  interface UpdateCampaignInfo extends BaseCampaignInfo {}

  type DENSAddressMap = Record<string, string | undefined>

  interface PayToken {
    symbol: string
    denom: string
    decimals: number
    swapAddress: string
  }
}

export enum CampaignContractVersion {
  v1 = "0.1.0",
  v2 = "0.2.0",
  v3 = "0.3.0",
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
  : V extends CampaignContractVersion.v2 | CampaignContractVersion.v3
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
