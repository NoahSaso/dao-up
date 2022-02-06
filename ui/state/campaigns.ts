import { selector, selectorFamily } from "recoil"

import { escrowContractCodeId } from "../helpers/config"
import { Status } from "../types"
import { cosmWasmClient } from "./web3"

// GET

export const fetchCampaignState = selectorFamily<CampaignStateResponse, string>(
  {
    key: "fetchCampaignState",
    get:
      (address) =>
      async ({ get }) => {
        const client = get(cosmWasmClient)

        try {
          if (!client) throw new Error("Failed to get client.")
          if (!address) throw new Error("Invalid address.")

          return {
            state: await client.queryContractSmart(address, {
              dump_state: {},
            }),
            error: null,
          }
        } catch (error) {
          console.error(error)
          // TODO: Return better error.
          return { state: null, error: `${error}` }
        }
      },
  }
)

export const fetchCampaign = selectorFamily<CampaignResponse, string>({
  key: "fetchCampaign",
  get:
    (address) =>
    async ({ get }) => {
      const { state: campaignState, error } = get(fetchCampaignState(address))
      if (error) return { campaign: null, error }

      const {
        campaign_info: campaignInfo,
        funding_token_info: fundingTokenInfo,
        ...state
      } = campaignState

      try {
        // Example: status={ "pending": {} }
        const status = Object.keys(state.status)[0] as Status

        return {
          campaign: {
            address,
            name: campaignInfo.name,
            description: campaignInfo.description,
            imageUrl: campaignInfo.image_url,

            status,
            creator: state.creator,
            hidden: campaignInfo.hidden,

            goal: Number(state.funding_goal.amount),
            pledged: Number(state.funds_raised.amount),
            // supporters: ,

            dao: {
              address: state.dao_addr,
              url: `https://daodao.zone/dao/${state.dao_addr}`,
            },

            fundingToken: {
              ...(status === Status.Pending && {
                price: Number(state.status[status].token_price),
              }),
              name: fundingTokenInfo.name,
              symbol: fundingTokenInfo.symbol,
              supply: Number(fundingTokenInfo.total_supply),
            },

            website: campaignInfo.website,
            twitter: campaignInfo.twitter,
            discord: campaignInfo.discord,

            activity: [],
          },
          error: null,
        }
      } catch (error) {
        console.error(error)
        // TODO: Return better error.
        return { campaign: null, error: `${error}` }
      }
    },
})

// GET ALL

export const escrowContractAddresses =
  selector<EscrowContractAddressesResponse>({
    key: "escrowContractAddresses",
    get: async ({ get }) => {
      const client = get(cosmWasmClient)

      try {
        if (!client) throw new Error("Failed to get client.")

        return {
          addresses: await client.getContracts(escrowContractCodeId),
          error: null,
        }
      } catch (error) {
        console.error(error)
        // TODO: Return better error.
        return { addresses: [], error: `${error}` }
      }
    },
  })
