import fuzzysort from "fuzzysort"
import _merge from "lodash.merge"

import { daoUrlPrefix } from "@/config"
import { getFilterFns, parseError } from "@/helpers"
import { CampaignContractVersion, Status, StatusFields } from "@/types"

export const defaultNewCampaign: Partial<NewCampaign> = {
  hidden: false,
  descriptionImageUrls: [],
  _descriptionImageUrls: [],
}

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
        (includePending || campaign.status !== Status.Pending)
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
  campaignState: any,
  status: Status,
  statusFields: any,
  campaignGovTokenBalance: number
): VersionedCampaignFields => {
  const { campaign_info: campaignInfo } = campaignState

  switch (version) {
    case CampaignContractVersion.v1:
      return {
        profileImageUrl: campaignInfo.image_url,
        // Introduced in v2.
        descriptionImageUrls: [],
        govToken: {
          campaignBalance: campaignGovTokenBalance,
        },
      }
    case CampaignContractVersion.v2:
      return {
        profileImageUrl: campaignInfo.profile_image_url,
        descriptionImageUrls: campaignInfo.description_image_urls ?? [],
        govToken: {
          campaignBalance:
            status === Status.Pending
              ? 0
              : (statusFields as StatusFields<typeof version, typeof status>)
                  .initial_gov_token_balance / 1e6,
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
        profileImageUrl: undefined,
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
  campaignState: any,
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

  if (
    typeof campaignGovTokenBalance !== "number" ||
    typeof daoGovTokenBalance !== "number" ||
    !campaignInfo ||
    !fundingTokenInfo ||
    !govTokenInfo ||
    !state ||
    !campaignState
  ) {
    return null
  }

  // Example: status={ "pending": {} }
  const status = Object.keys(state.status)[0] as Status
  const statusFields = state.status[status]

  // First contract has no version set.
  const version = Object.values(CampaignContractVersion).includes(stateVersion)
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
      ...(status !== Status.Pending && {
        price: Number(
          (statusFields as StatusFields<typeof version, typeof status>)
            .token_price
        ),
        // Funding tokens are minted on-demand, so calculate the total that will ever exist
        // by multiplying the price of one token (in JUNO) by the goal (in JUNO).
        supply:
          (Number(state.funding_goal.amount) *
            Number(
              (statusFields as StatusFields<typeof version, typeof status>)
                .token_price
            )) /
          1e6,
      }),
      name: fundingTokenInfo.name,
      symbol: fundingTokenInfo.symbol,
    },

    website: campaignInfo.website,
    twitter: campaignInfo.twitter,
    discord: campaignInfo.discord,
  }

  return _merge(baseFields, versionedFields)
}
