import { atomFamily, selector, selectorFamily } from "recoil"

import { daoUrlPrefix, escrowContractCodeId } from "../helpers/config"
import { Status } from "../types"
import { cosmWasmClient } from "./web3"

export const campaignStateId = atomFamily<number, string | undefined>({
  key: "campaignStateId",
  default: 0,
})

export const campaignState = selectorFamily<CampaignStateResponse, string>({
  key: "campaignState",
  get:
    (address) =>
    async ({ get }) => {
      // Allow us to manually refresh campaign state.
      get(campaignStateId(address))

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
})

export const fetchCampaign = selectorFamily<CampaignResponse, string>({
  key: "fetchCampaign",
  get:
    (address) =>
    async ({ get }) => {
      const { state: cState, error: campaignError } = get(
        campaignState(address)
      )
      if (campaignError || cState === null)
        return { campaign: null, error: campaignError ?? "Unknown error." }

      const {
        campaign_info: campaignInfo,
        funding_token_info: fundingTokenInfo,
        ...state
      } = cState

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

            goal: Number(state.funding_goal.amount) / 1e6,
            pledged: Number(state.funds_raised.amount) / 1e6,
            // supporters: ,

            dao: {
              address: state.dao_addr,
              url: daoUrlPrefix + state.dao_addr,
              govToken: {
                address: state.gov_token_addr,
              },
            },

            fundingToken: {
              address: state.funding_token_addr,
              ...(status === Status.Open && {
                price: Number(state.status[status].token_price),
              }),
              name: fundingTokenInfo.name,
              symbol: fundingTokenInfo.symbol,
              supply: Number(fundingTokenInfo.total_supply) / 1e6,
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

export const tokenInfo = selectorFamily<TokenInfoResponse, string>({
  key: "tokenInfo",
  get:
    (address) =>
    async ({ get }) => {
      const client = get(cosmWasmClient)

      try {
        if (!address) throw new Error("Invalid address.")
        if (!client) throw new Error("Failed to get client.")

        return {
          info: await client.queryContractSmart(address, {
            token_info: {},
          }),
          error: null,
        }
      } catch (error) {
        console.error(error)
        // TODO: Return better error.
        return { info: null, error: `${error}` }
      }
    },
})

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
