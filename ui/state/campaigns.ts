import { atomFamily, selector, selectorFamily } from "recoil"

import { daoUrlPrefix, escrowContractCodeId } from "../helpers/config"
import { CampaignActionType, Status } from "../types"
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

export const fetchBlockHeight = selector<number | null>({
  key: "fetchBlockHeight",
  get: async ({ get }) => {
    const client = get(cosmWasmClient)

    try {
      if (!client) throw new Error("Failed to get client.")

      return await client.getHeight()
    } catch (error) {
      console.error(error)

      return null
    }
  },
})

export const fetchCampaignActions = selectorFamily<
  CampaignActionsResponse,
  string
>({
  key: "fetchCampaignActions",
  get:
    (address) =>
    async ({ get }) => {
      get(campaignStateId(address))

      const client = get(cosmWasmClient)
      const blockHeight = get(fetchBlockHeight)

      try {
        if (!address) throw new Error("Invalid address.")
        if (!client) throw new Error("Failed to get client.")

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
        const fundActions: CampaignAction[] = funds.map((fund) => {
          let amount =
            Number(
              fund.wasm.attributes.find((a: any) => a.key === "amount")?.value
            ) / 1e6
          let address = fund.wasm.attributes.find(
            (a: any) => a.key === "sender"
          )?.value as string

          let when
          if (blockHeight !== null) {
            const elapsedBlocks = blockHeight - fund.height
            // Juno block times are normally in the 6 to 6.5 second
            // range. This really doesn't need to be terribly accurate.
            const elapsedTime = elapsedBlocks * 6.3
            when = new Date()
            when.setSeconds(when.getSeconds() - elapsedTime)
          }

          return {
            type: CampaignActionType.Fund,
            address,
            amount,
            when,
          }
        })
        const refundActions: CampaignAction[] = refunds.map((fund) => {
          let amount =
            Number(
              fund.wasm.attributes.find((a: any) => a.key === "native_returned")
                ?.value
            ) / 1e6
          let address = fund.wasm.attributes.find(
            (a: any) => a.key === "sender"
          )?.value as string

          let when
          if (blockHeight !== null) {
            const elapsedBlocks = blockHeight - fund.height
            const elapsedTime = elapsedBlocks * 6.3
            when = new Date()
            when.setSeconds(when.getSeconds() - elapsedTime)
          }

          return {
            type: CampaignActionType.Refund,
            address,
            amount,
            when,
          }
        })

        // Combine and sort descending (most recent first).
        const actions = [...refundActions, ...fundActions].sort((a, b) => {
          if (a.when === undefined) return 1
          if (b.when === undefined) return -1
          return b.when.getTime() - a.when.getTime()
        })

        return {
          actions,
          error: null,
        }
      } catch (error) {
        console.error(error)
        // TODO: Return better error.
        return {
          actions: null,
          error: `${error}`,
        }
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
        gov_token_info: govTokenInfo,
        ...state
      } = cState

      const {
        balance: campaignGovTokenBalance,
        error: campaignGovTokenBalanceError,
      } = get(
        tokenBalance({
          tokenAddress: state.gov_token_addr,
          walletAddress: address,
        })
      )
      if (campaignGovTokenBalanceError || campaignGovTokenBalance === null)
        return {
          campaign: null,
          error: campaignGovTokenBalanceError ?? "Unknown error.",
        }

      const { balance: daoGovTokenBalance, error: daoGovTokenBalanceError } =
        get(
          tokenBalance({
            tokenAddress: state.gov_token_addr,
            walletAddress: state.dao_addr,
          })
        )
      if (daoGovTokenBalanceError || daoGovTokenBalance === null)
        return {
          campaign: null,
          error: daoGovTokenBalanceError ?? "Unknown error.",
        }

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
                name: govTokenInfo.name,
                symbol: govTokenInfo.symbol,
                campaignBalance: campaignGovTokenBalance,
                daoBalance: daoGovTokenBalance,
                supply: Number(govTokenInfo.total_supply) / 1e6,
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

export const tokenBalance = selectorFamily<
  TokenBalanceResponse,
  {
    tokenAddress: string | undefined | null
    walletAddress: string | undefined | null
  }
>({
  key: "tokenBalance",
  get:
    ({ tokenAddress, walletAddress }) =>
    async ({ get }) => {
      if (!tokenAddress || !walletAddress) return { balance: null, error: null }

      const client = get(cosmWasmClient)

      try {
        if (!client) throw new Error("Failed to get client.")

        const { balance } = await client.queryContractSmart(tokenAddress, {
          balance: { address: walletAddress },
        })

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

export const campaignWalletBalance = selectorFamily<
  TokenBalanceResponse,
  string | undefined | null
>({
  key: "campaignWalletBalance",
  get:
    (campaignAddress) =>
    async ({ get }) => {
      if (!campaignAddress) return { balance: null, error: null }

      const address = get(walletAddress)

      if (!address) return { balance: null, error: null }

      const { campaign, error: campaignError } = get(
        fetchCampaign(campaignAddress)
      )
      if (campaignError || campaign === null)
        return { balance: null, error: null }

      const { balance, error: tokenBalanceError } = get(
        tokenBalance({
          tokenAddress: campaign.fundingToken.address,
          walletAddress: address,
        })
      )
      if (tokenBalanceError || balance === null)
        return { balance: null, error: tokenBalanceError }

      return { balance, error: null }
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

export const daoConfig = selectorFamily<DAOConfigResponse, string | undefined>({
  key: "daoConfig",
  get:
    (address) =>
    async ({ get }) => {
      const client = get(cosmWasmClient)

      try {
        if (!address) throw new Error("Invalid address.")
        if (!client) throw new Error("Failed to get client.")

        return {
          config: await client.queryContractSmart(address, {
            get_config: {},
          }),
          error: null,
        }
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("decoding bech32 failed: invalid checksum") ||
            error.message.includes("contract: not found") ||
            error.message === "Invalid address.")
        )
          return {
            config: null,
            error:
              "DAO does not exist on chain (ensure your DAO exists on the Juno Testnet chain).",
          }

        return { config: null, error: `${error}` }
      }
    },
})
