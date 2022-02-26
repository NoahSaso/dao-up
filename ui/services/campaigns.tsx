import fuzzysort from "fuzzysort"
import _merge from "lodash.merge"

import { daoUrlPrefix, minPayTokenSymbol, payTokenSymbol } from "@/config"
import { getFilterFns, parseError } from "@/helpers"
import {
  CampaignContractVersion,
  CampaignStatus,
  CampaignVersionedStatus,
} from "@/types"

import { tokens as ibcAssetsTokens } from "./ibc_assets.json"

const allowedIBCAssets = ["UST"]
export const payTokens: PayToken[] = [
  // Default chain symbol (probably juno(x))
  {
    symbol: payTokenSymbol,
    denom: minPayTokenSymbol,
    junoDenom: minPayTokenSymbol,
  },
  ...ibcAssetsTokens.filter((token) => allowedIBCAssets.includes(token.symbol)),
]

export const defaultNewCampaign: Partial<NewCampaignInfo> = {
  // Default to first payToken, which should be juno(x).
  payTokenDenom: payTokens[0].denom,
  hidden: false,
  descriptionImageUrls: [],
  _descriptionImageUrls: [],
}

export const requiredNewCampaignFields: (keyof NewCampaignInfo)[] = [
  "name",
  "description",
  "hidden",
  "goal",
  "daoAddress",
  "tokenName",
  "tokenSymbol",
  // Empty array.
  "descriptionImageUrls",
]

export const requiredUpdateCampaignFields: (keyof UpdateCampaignInfo)[] = [
  "name",
  "description",
  "hidden",
  // Empty array.
  "descriptionImageUrls",
]

export const campaignsFromResponses = (
  campaignResponses: CampaignResponse[],
  includeHidden = false,
  includePending = false
): Campaign[] =>
  campaignResponses
    .filter(
      ({ campaign }) =>
        !!campaign &&
        (includeHidden || !campaign.hidden) &&
        (includePending || campaign.status !== CampaignStatus.Pending)
    )
    .map(({ campaign }) => campaign!)

export const filterCampaigns = async (
  campaigns: Campaign[],
  filter?: string
) => {
  if (!filter) return campaigns

  const { query, filterFns } = getFilterFns(filter)

  if (filterFns)
    // Filter out campaigns that don't match all active filters.
    campaigns = campaigns.filter((campaign) =>
      filterFns.every((fn) => fn(campaign))
    )

  if (!query) return campaigns

  return (
    await fuzzysort.goAsync(query, campaigns, {
      keys: ["name", "description"],
      allowTypo: true,
    })
  ).map(({ obj }) => obj)
}

// Different fields based on Campaign contract version.
export const transformVersionedCampaignFields = (
  version: CampaignContractVersion,
  address: string,
  campaignState: CampaignDumpStateResponse,
  status: CampaignStatus,
  statusFields: CampaignDumpStateStatus[CampaignStatus],
  campaignGovTokenBalance: number
): VersionedCampaignFields => {
  const { campaign_info: campaignInfo } = campaignState

  switch (version) {
    case CampaignContractVersion.v1:
      return {
        profileImageUrl: campaignInfo.image_url ?? null,
        // Introduced in v2.
        descriptionImageUrls: [],
        govToken: {
          campaignBalance: campaignGovTokenBalance,
        },
      }
    case CampaignContractVersion.v2:
      return {
        profileImageUrl: campaignInfo.profile_image_url ?? null,
        descriptionImageUrls: campaignInfo.description_image_urls ?? [],
        govToken: {
          campaignBalance:
            status === CampaignStatus.Pending
              ? 0
              : Number(
                  (
                    statusFields as CampaignVersionedStatus<
                      typeof version,
                      typeof status
                    >
                  ).initial_gov_token_balance
                ) / 1e6,
        },
      }
    default: {
      console.error(
        parseError("Unknown campaign contract version.", {
          source: "transformVersionedCampaignFields",
          campaign: address,
          version,
          campaignState,
        })
      )

      return {
        profileImageUrl: null,
        descriptionImageUrls: [],
        govToken: {
          campaignBalance: campaignGovTokenBalance,
        },
      }
    }
  }
}

// Transform blockchain data into typed campaign object.
export const transformCampaign = (
  address: string,
  campaignState: CampaignDumpStateResponse,
  campaignGovTokenBalance: number | undefined | null,
  daoGovTokenBalance: number | undefined | null,
  featuredAddresses?: string[],
  densAddressMap?: Record<string, string | undefined>
): Campaign | null => {
  const {
    version: stateVersion,
    campaign_info: campaignInfo,
    funding_token_info: fundingTokenInfo,
    gov_token_info: govTokenInfo,
    ...state
  } = campaignState ?? {}

  const payToken = payTokens.find(
    ({ denom }) => denom === state.funding_goal.denom
  )

  if (
    typeof campaignGovTokenBalance !== "number" ||
    typeof daoGovTokenBalance !== "number" ||
    !campaignInfo ||
    !fundingTokenInfo ||
    !govTokenInfo ||
    !state ||
    !campaignState ||
    !payToken
  ) {
    return null
  }

  // Example: status={ "pending": {} }
  const status = Object.keys(state.status)[0] as keyof CampaignDumpStateStatus
  const statusFields = state.status[status]!

  // First contract has no version set.
  const version = Object.values(CampaignContractVersion).includes(
    stateVersion as any
  )
    ? (stateVersion as CampaignContractVersion)
    : CampaignContractVersion.v1
  // Get fields based on contract version.
  const versionedFields = transformVersionedCampaignFields(
    version,
    address,
    campaignState,
    status,
    statusFields,
    campaignGovTokenBalance
  )

  const baseFields = {
    version,
    address,
    name: campaignInfo.name,
    description: campaignInfo.description,
    // Use deNS name from map if available.
    urlPath: `/campaign/${densAddressMap?.[address] ?? address}`,

    status,
    creator: state.creator,
    hidden: campaignInfo.hidden,
    featured: featuredAddresses?.includes(address) ?? false,

    payToken,
    goal: Number(state.funding_goal.amount) / 1e6,
    pledged: Number(state.funds_raised.amount) / 1e6,
    // backers: ,

    dao: {
      address: state.dao_addr,
      url: daoUrlPrefix + state.dao_addr,
    },

    govToken: {
      address: state.gov_token_addr,
      name: govTokenInfo.name,
      symbol: govTokenInfo.symbol,
      daoBalance: daoGovTokenBalance,
      supply: Number(govTokenInfo.total_supply) / 1e6,
    },

    fundingToken: {
      address: state.funding_token_addr,
      ...(status !== CampaignStatus.Pending
        ? {
            price: Number(
              (
                statusFields as CampaignVersionedStatus<
                  typeof version,
                  typeof status
                >
              ).token_price
            ),
            // Funding tokens are minted on-demand, so calculate the total that will ever exist
            // by multiplying the price of one token (in JUNO) by the goal (in JUNO).
            supply:
              (Number(state.funding_goal.amount) *
                Number(
                  (
                    statusFields as CampaignVersionedStatus<
                      typeof version,
                      typeof status
                    >
                  ).token_price
                )) /
              1e6,
          }
        : {
            price: null,
            supply: null,
          }),
      name: fundingTokenInfo.name,
      symbol: fundingTokenInfo.symbol,
    },

    website: campaignInfo.website ?? null,
    twitter: campaignInfo.twitter ?? null,
    discord: campaignInfo.discord ?? null,
  }

  return _merge(baseFields, versionedFields)
}

export const getPayTokenLabel = (denom: string) =>
  payTokens.find(({ denom: d }) => d === denom)?.symbol ?? "Unknown"

export const getNextPayTokenDenom = (denom: string) =>
  payTokens[
    (payTokens.findIndex(({ denom: d }) => d === denom) + 1) % payTokens.length
  ].denom
