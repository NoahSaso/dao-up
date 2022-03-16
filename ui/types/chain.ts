import { Coin } from "@cosmjs/amino"

import { CampaignStatus } from "@/types"

declare global {
  type TokenInfoResponse = {
    decimals: number
    name: string
    symbol: string
    total_supply: number
  }

  interface CampaignDumpStateResponse {
    campaign_info: CampaignInfo
    creator: string
    dao_addr: string
    fee_manager_addr?: string // v3
    funding_goal: Coin
    funding_token_addr: string
    funding_token_info: TokenInfoResponse
    funds_raised: Coin
    gov_token_addr: string
    gov_token_info?: TokenInfoResponse
    status: CampaignDumpStateStatus
    version?: string
  }

  // See CampaignVersionedStatus for more fine-grained types.
  type CampaignDumpStateStatus = Record<
    CampaignStatus,
    | {
        initial_gov_token_balance?: string
        token_price?: string
      }
    | undefined
  >

  interface AddressPriorityListItem {
    addr: string
    priority: number
  }

  interface AddressPriorityListResponse {
    members: AddressPriorityListItem[]
  }

  interface FeeManagerGetConfigResponse {
    config: {
      receiver_addr: string
      fee: string
      public_listing_fee: Coin
    }
  }

  interface FeeManagerConfigResponse {
    fee: number
    publicListingFee: {
      token: PayToken
      coin: Coin
    }
  }
}

interface CampaignInfo {
  description: string
  description_image_urls?: string[]
  discord?: string | null
  hidden: boolean
  image_url?: string | null
  name: string
  profile_image_url?: string | null
  twitter?: string | null
  website?: string | null
}
