import { atomFamily, selector, selectorFamily } from "recoil"

import { daoUrlPrefix, escrowContractCodeId } from "../helpers/config"
import { ActivityType, Status } from "../types"
import { cosmWasmClient, walletAddress } from "./web3"

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

export const fetchBlockHeight = selector<number>({
  key: "fetchBlockHeight",
  get: async ({ get }) => {
    const client = get(cosmWasmClient)

    try {
      if (!client) throw new Error("Failed to get client.")
      const block_height = await client.getHeight()
      return block_height
    } catch (error) {
      console.error(error)
      return 0
    }
  },
})

export const fetchCampaignFundActions = selectorFamily<ActivityItem[], string>({
  key: "fetchCampaignFundAction",
  get:
    (address) =>
    async ({ get }) => {
      get(campaignStateId(address))

      const client = get(cosmWasmClient)
      const block_height = get(fetchBlockHeight)

      try {
        if (!address) throw new Error("Invalid address")
        if (!client) throw new Error("Failed to get client")

        // Get all of the wasm messages involving this contract.
        const events = await client.searchTx({
          tags: [{ key: "wasm._contract_address", value: address }],
        })
        // Parse their logs.
        const logs = events.map((e) => ({
          log: JSON.parse(e.rawLog),
          height: e.height,
        }))
        // Get the wasm components of their logs.
        const wasms = logs
          .map((l) => ({
            wasm: l.log[0].events.find((e: any) => e.type === "wasm"),
            height: l.height,
          }))
          .filter((w) => !!w.wasm)
        // Get the messages that are fund messages.
        const funds = wasms.filter((wasm) =>
          wasm.wasm.attributes.some((a: any) => a.value === "fund")
        )

        // Get the messages that are refund messages.
        const refunds = wasms.filter((wasm) =>
          wasm.wasm.attributes.some((a: any) => a.value === "refund")
        )

        // Extract the amount and sender.
        const fundActivities = funds.map((fund) => {
          let amount = Number(
            fund.wasm.attributes.find((a: any) => a.key === "amount")?.value
          )
          let address = fund.wasm.attributes.find(
            (a: any) => a.key === "sender"
          )?.value as string

          const elapsed_blocks = block_height - fund.height
          // Juno block times are normally in the 6 to 6.5 second
          // range. This really doesn't need to be terribly accurate.
          const elapsed_time = elapsed_blocks * 6.3
          const when = new Date()
          when.setSeconds(when.getSeconds() - elapsed_time)

          return {
            address,
            amount,
            when,
            activity: ActivityType.Fund,
          }
        })
        const refundActivities = refunds.map((fund) => {
          let amount = Number(
            fund.wasm.attributes.find((a: any) => a.key === "native_returned")
              ?.value
          )
          let address = fund.wasm.attributes.find(
            (a: any) => a.key === "sender"
          )?.value as string

          const elapsed_blocks = block_height - fund.height
          const elapsed_time = elapsed_blocks * 6.3
          const when = new Date()
          when.setSeconds(when.getSeconds() - elapsed_time)

          return {
            address,
            amount,
            when,
            activity: ActivityType.Refund,
          }
        })

        // Combine and sort.
        const activites = refundActivities
          .concat(fundActivities)
          .sort((l, r) => {
            const dl = l.when
            const dr = r.when
            if (dl < dr) return -1
            if (dr < dl) return 1
            return 0
          })

        return activites
      } catch (error) {
        console.error(error)
        return []
      }
    },
})

export const fetchCampaign = selectorFamily<CampaignResponse, string>({
  key: "fetchCampaign",
  get:
    (address) =>
    async ({ get }) => {
      const { state: cState, error: campaignStateError } = get(
        campaignState(address)
      )
      if (campaignStateError || cState === null)
        return { campaign: null, error: campaignStateError ?? "Unknown error." }

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

export const campaignWalletBalance = selectorFamily<
  CampaignWalletBalanceResponse,
  string | undefined | null
>({
  key: "campaignWalletBalance",
  get:
    (campaignAddress) =>
    async ({ get }) => {
      if (!campaignAddress) return { balance: null, error: null }

      const address = get(walletAddress)
      const client = get(cosmWasmClient)

      const { campaign, error: campaignError } = get(
        fetchCampaign(campaignAddress)
      )
      if (campaignError || campaign === null)
        return { balance: null, error: null }

      try {
        if (!address) throw new Error("Wallet not connected.")
        if (!client) throw new Error("Failed to get client.")
        if (!campaign) throw new Error("Failed to get campaign.")

        const { balance } = await client.queryContractSmart(
          campaign.fundingToken.address,
          {
            balance: { address },
          }
        )

        return {
          balance: Number(balance) / 1e6,
          error: null,
        }
      } catch (error) {
        console.error(error)
        // TODO: Return better error.
        return { balance: null, error: `${error}` }
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
