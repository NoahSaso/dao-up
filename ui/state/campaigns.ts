import { QueryContractsByCodeResponse } from "cosmjs-types/cosmwasm/wasm/v1/query"
import { atom, atomFamily, selector, selectorFamily, waitForAll } from "recoil"

import {
  chainName,
  daoUrlPrefix,
  denyListContractAddress,
  escrowContractCodeId,
} from "@/config"
import { extractPageInfo, parseError } from "@/helpers"
import { campaignsFromResponses, filterCampaigns } from "@/services"
import { cosmWasmClient, cosmWasmQueryClient, walletAddress } from "@/state"
import { localStorageEffectJSON } from "@/state/effects"
import { CampaignActionType, CommonError, Status } from "@/types"

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

      if (!client) return { state: null, error: CommonError.GetClientFailed }
      if (!address) return { state: null, error: CommonError.InvalidAddress }

      try {
        const state = await client.queryContractSmart(address, {
          dump_state: {},
        })

        return { state, error: null }
      } catch (error) {
        console.error(error)
        return { state: null, error: parseError(error) }
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

      if (!address)
        return {
          actions: null,
          error: CommonError.InvalidAddress,
        }
      if (!client)
        return {
          actions: null,
          error: CommonError.GetClientFailed,
        }

      try {
        const blockHeight = await client?.getHeight()

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

        return { actions, error: null }
      } catch (error) {
        console.error(error)
        return { actions: null, error: parseError(error) }
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
            // backers: ,

            dao: {
              address: state.dao_addr,
              url: daoUrlPrefix + state.dao_addr,
            },

            govToken: {
              address: state.gov_token_addr,
              name: govTokenInfo.name,
              symbol: govTokenInfo.symbol,
              campaignBalance: campaignGovTokenBalance,
              daoBalance: daoGovTokenBalance,
              supply: Number(govTokenInfo.total_supply) / 1e6,
            },

            fundingToken: {
              address: state.funding_token_addr,
              ...(status === Status.Open && {
                price: Number(state.status[status].token_price),
                // Funding tokens are minted on-demand, so calculate the total that will ever exist
                // by multiplying the price of one token (in JUNO) by the goal (in JUNO).
                supply:
                  (Number(state.funding_goal.amount) *
                    Number(state.status[status].token_price)) /
                  1e6,
              }),
              name: fundingTokenInfo.name,
              symbol: fundingTokenInfo.symbol,
            },

            website: campaignInfo.website,
            twitter: campaignInfo.twitter,
            discord: campaignInfo.discord,
          },
          error: null,
        }
      } catch (error) {
        console.error(error)
        return { campaign: null, error: parseError(error) }
      }
    },
})

export const tokenInfo = selectorFamily<TokenInfoResponse, string>({
  key: "tokenInfo",
  get:
    (address) =>
    async ({ get }) => {
      const client = get(cosmWasmClient)

      if (!address)
        return {
          info: null,
          error: CommonError.InvalidAddress,
        }
      if (!client)
        return {
          info: null,
          error: CommonError.GetClientFailed,
        }

      try {
        const info = await client.queryContractSmart(address, {
          token_info: {},
        })

        return { info, error: null }
      } catch (error) {
        console.error(error)
        return { info: null, error: parseError(error) }
      }
    },
})

export const tokenAddressBalanceId = atomFamily<number, string | undefined>({
  key: "tokenAddressBalanceId",
  default: 0,
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

      // Allow us to manually refresh balance for given token.
      get(tokenAddressBalanceId(tokenAddress))

      const client = get(cosmWasmClient)

      if (!client)
        return {
          balance: null,
          error: CommonError.GetClientFailed,
        }

      try {
        const { balance } = await client.queryContractSmart(tokenAddress, {
          balance: { address: walletAddress },
        })

        return {
          balance: Number(balance) / 1e6,
          error: null,
        }
      } catch (error) {
        console.error(error)
        return { balance: null, error: parseError(error) }
      }
    },
})

export const walletTokenBalance = selectorFamily<
  TokenBalanceResponse,
  string | undefined | null
>({
  key: "walletTokenBalance",
  get:
    (tokenAddress) =>
    async ({ get }) => {
      const address = get(walletAddress)

      if (!address) return { balance: null, error: null }

      const { balance, error: tokenBalanceError } = get(
        tokenBalance({
          tokenAddress,
          walletAddress: address,
        })
      )
      if (tokenBalanceError || balance === null)
        return { balance: null, error: tokenBalanceError }

      return { balance, error: null }
    },
})

export const escrowContractAddresses = selectorFamily<
  QueryContractsByCodeResponse | undefined,
  { startAtKey?: number[] }
>({
  key: "escrowContractAddresses",
  get:
    ({ startAtKey }) =>
    async ({ get }) => {
      const queryClient = get(cosmWasmQueryClient)
      if (!queryClient) return

      return await queryClient.wasm.listContractsByCodeId(
        escrowContractCodeId,
        startAtKey && new Uint8Array(startAtKey)
      )
    },
})

// Pass null to get all addresses.
export const pagedEscrowContractAddresses = selectorFamily<
  EscrowContractAddressesResponse,
  PageInfo | null
>({
  key: "pagedEscrowContractAddresses",
  get:
    (page) =>
    async ({ get }) => {
      const addresses: string[] = []

      // Don't attempt to get paged contracts if no client.
      const queryClient = get(cosmWasmQueryClient)
      if (!queryClient)
        return {
          addresses,
          error: "Failed to get query client.",
        }

      let startAtKey: number[] | undefined = undefined
      do {
        const addressDenyList = get(campaignDenyList)
        const response = get(
          escrowContractAddresses({
            startAtKey: startAtKey && Array.from(startAtKey),
          })
        ) as QueryContractsByCodeResponse | undefined

        if (response) {
          const contracts = response.contracts.filter(
            (a) => !addressDenyList.includes(a)
          )
          addresses.push(...contracts)
          startAtKey = Array.from(response.pagination?.nextKey ?? [])
        }
      } while (
        startAtKey?.length !== 0 &&
        (!page || addresses.length - 1 < page.endIndex)
      )

      return {
        addresses: page
          ? addresses.slice(page.startIndex, page.endIndex)
          : addresses,
        error: null,
      }
    },
})

export const campaignDenyList = selector<string[]>({
  key: "campaignDenyList",
  get: async ({ get }) => {
    const client = get(cosmWasmClient)
    try {
      if (!client) {
        return []
      }
      const addresses = (
        (await client.queryContractSmart(denyListContractAddress, {
          get_addresses: {},
        })) as AddressPriorityListResponse
      ).map(({ addr }) => addr)

      return addresses
    } catch (e) {
      console.error(e)
      return []
    }
  },
})

export const filteredCampaigns = selectorFamily<
  CampaignsResponse,
  {
    filter: string
    includeHidden?: boolean
    includePending?: boolean
    page: number
    size: number
  }
>({
  key: "filteredCampaigns",
  get:
    ({ filter, includeHidden = false, includePending = true, page, size }) =>
    async ({ get }) => {
      const allCampaigns: Campaign[] = []
      const pageInfo = extractPageInfo(page, size)

      let addressPage = 1
      const addressPageSize = 50
      let addressesLeft = true
      do {
        const addressPageInfo = extractPageInfo(addressPage, addressPageSize)

        const { addresses, error: addressesError } = get(
          pagedEscrowContractAddresses(addressPageInfo)
        )
        if (addressesError)
          return { campaigns: null, hasMore: false, error: addressesError }

        const pageAddresses = addresses.slice(
          addressPageInfo.startIndex,
          addressPageInfo.endIndex
        )

        // If we got the asked-for page size, we might still have addresses left.
        addressesLeft = pageAddresses.length === addressPageSize

        const campaignResponses = get(
          waitForAll(pageAddresses.map((address) => fetchCampaign(address)))
        )

        let relevantCampaigns = campaignsFromResponses(
          campaignResponses,
          includeHidden,
          includePending
        )
        relevantCampaigns = await filterCampaigns(relevantCampaigns, filter)
        allCampaigns.unshift(...relevantCampaigns)

        addressPage++

        // Stop once 2 more addresses have been loaded after endIndex, since end is an index (+1 to get count) AND we want to see if there are any addresses left (+1 to check existence of address on next page).
      } while (allCampaigns.length < pageInfo.endIndex + 2 && addressesLeft)

      return {
        campaigns: allCampaigns.slice(pageInfo.startIndex, pageInfo.endIndex),
        // More pages if more campaigns exist beyond this page's end.
        hasMore: allCampaigns.length > pageInfo.endIndex,
        error: null,
      }
    },
})

export const allCampaigns = selector<CampaignsResponse>({
  key: "allCampaigns",
  get: async ({ get }) => {
    const { addresses, error: addressesError } = get(
      pagedEscrowContractAddresses(null)
    )
    if (addressesError)
      return { campaigns: [], hasMore: false, error: addressesError }

    const campaignResponses = get(
      waitForAll(addresses.map((address) => fetchCampaign(address)))
    )
    const campaigns = campaignsFromResponses(campaignResponses, true, true)

    return { campaigns, hasMore: false, error: null }
  },
})

export const daoConfig = selectorFamily<DAOConfigResponse, string | undefined>({
  key: "daoConfig",
  get:
    (address) =>
    async ({ get }) => {
      const client = get(cosmWasmClient)

      if (!address)
        return {
          config: null,
          error: CommonError.InvalidAddress,
        }
      if (!client)
        return {
          config: null,
          error: CommonError.GetClientFailed,
        }

      try {
        const config = await client.queryContractSmart(address, {
          get_config: {},
        })

        return { config, error: null }
      } catch (error) {
        console.error(error)
        return {
          config: null,
          error: parseError(error, {
            // Give more specific error for invalid addresses.
            [CommonError.InvalidAddress]: `DAO does not exist on chain (ensure your DAO exists on the ${chainName} chain).`,
          }),
        }
      }
    },
})

export const favoriteCampaignAddressesKey = "favoriteCampaignAddresses"
// Change keplrKeystoreId to trigger Keplr refresh/connect.
// Set to -1 to disable connection.
export const favoriteCampaignAddressesAtom = atom({
  key: favoriteCampaignAddressesKey,
  default: [] as string[],
  effects: [localStorageEffectJSON(favoriteCampaignAddressesKey)],
})

export const favoriteCampaigns = selector<CampaignsResponse>({
  key: "favoriteCampaigns",
  get: async ({ get }) => {
    const addresses = get(favoriteCampaignAddressesAtom)
    const campaignResponses = get(
      waitForAll(addresses.map((address) => fetchCampaign(address)))
    )
    const campaigns = campaignsFromResponses(campaignResponses, true, true)

    return { campaigns, hasMore: false, error: null }
  },
})
