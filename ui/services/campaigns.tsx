import fuzzysort from "fuzzysort"
import _merge from "lodash.merge"

import { daoUrlPrefix, feeManagerAddress } from "@/config"
import { convertMicroDenomToDenom, getFilterFns, parseError } from "@/helpers"
import { baseToken, findPayTokenByDenom } from "@/services"
import {
  CampaignContractVersion,
  CampaignStatus,
  CampaignVersionedStatus,
} from "@/types"

export const defaultNewCampaign = (): Partial<NewCampaignInfo> => ({
  // Default to first payToken, which should be juno(x).
  payTokenDenom: baseToken.denom,
  hidden: true,
  descriptionImageUrls: [],
  _descriptionImageUrls: [],
})

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
  includePending = false,
  // Include if no fee manager set. For backwards compatibility.
  includeNoFeeManager = false
): Campaign[] =>
  campaignResponses
    .filter(
      ({ campaign }) =>
        !!campaign &&
        (includeHidden || !campaign.hidden) &&
        (includePending || campaign.status !== CampaignStatus.Pending) &&
        // Only show campaigns that use our fee manager.
        (campaign.feeManagerAddress === feeManagerAddress ||
          (includeNoFeeManager && campaign.feeManagerAddress === null))
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
  campaignGovTokenBalance: number,
  govTokenInfo: TokenInfoResponse
): VersionedCampaignFields => {
  const { campaign_info: campaignInfo } = campaignState

  switch (version) {
    case CampaignContractVersion.v1:
      return {
        feeManagerAddress: null,
        profileImageUrl: campaignInfo.image_url ?? null,
        // Introduced in v2.
        descriptionImageUrls: [],
        govToken: {
          campaignBalance: campaignGovTokenBalance,
        },
      }
    case CampaignContractVersion.v2:
    case CampaignContractVersion.v3:
      return {
        feeManagerAddress: campaignState.fee_manager_addr ?? null,
        profileImageUrl: campaignInfo.profile_image_url ?? null,
        descriptionImageUrls: campaignInfo.description_image_urls ?? [],
        govToken: {
          campaignBalance:
            status === CampaignStatus.Pending
              ? 0
              : convertMicroDenomToDenom(
                  (
                    statusFields as CampaignVersionedStatus<
                      typeof version,
                      typeof status
                    >
                  ).initial_gov_token_balance,
                  govTokenInfo.decimals
                ),
        },
      }
    default: {
      console.error(
        parseError(
          "Unknown campaign contract version.",
          {
            source: "transformVersionedCampaignFields",
            campaign: address,
            version,
          },
          {
            extra: { campaignState },
          }
        )
      )

      return {
        feeManagerAddress: null,
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
  createdBlockHeight: number | null,
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

  const payToken = findPayTokenByDenom(state.funding_goal.denom)

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
    campaignGovTokenBalance,
    govTokenInfo
  )

  const baseFields = {
    version,

    createdBlockHeight,
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
    goal: convertMicroDenomToDenom(
      state.funding_goal.amount,
      payToken.decimals
    ),
    pledged: convertMicroDenomToDenom(
      state.funds_raised.amount,
      payToken.decimals
    ),
    // backers: ,

    dao: {
      address: state.dao_addr,
      url: daoUrlPrefix + state.dao_addr,
    },

    govToken: {
      address: state.gov_token_addr,
      ...govTokenInfo,
      // Convert to supply.
      total_supply: undefined,
      supply: convertMicroDenomToDenom(
        govTokenInfo.total_supply,
        govTokenInfo.decimals
      ),

      daoBalance: daoGovTokenBalance,
    },

    fundingToken: {
      address: state.funding_token_addr,
      ...fundingTokenInfo,
      // Convert to supply.
      total_supply: undefined,

      ...(status !== CampaignStatus.Pending
        ? {
            // Funding tokens are minted on-demand, so calculate the total that will ever exist
            // by multiplying the price of one token (in payToken) by the goal (in payToken).
            supply: convertMicroDenomToDenom(
              Number(state.funding_goal.amount) *
                Number(
                  (
                    statusFields as CampaignVersionedStatus<
                      typeof version,
                      typeof status
                    >
                  ).token_price
                ),
              fundingTokenInfo.decimals
            ),
            price: Number(
              (
                statusFields as CampaignVersionedStatus<
                  typeof version,
                  typeof status
                >
              ).token_price
            ),
          }
        : {
            supply: null,
            price: null,
          }),
    },

    website: campaignInfo.website ?? null,
    twitter: campaignInfo.twitter ?? null,
    discord: campaignInfo.discord ?? null,
  }

  return _merge(baseFields, versionedFields)
}
