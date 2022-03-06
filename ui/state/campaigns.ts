import { QueryContractsByCodeResponse } from "cosmjs-types/cosmwasm/wasm/v1/query"
import { atom, atomFamily, selector, selectorFamily, waitForAll } from "recoil"

import { escrowContractCodeIds } from "@/config"
import {
  blockHeightToSeconds,
  CommonError,
  convertMicroDenomToDenom,
  extractPageInfo,
  parseError,
} from "@/helpers"
import {
  campaignsFromResponses,
  createDENSAddressMap,
  filterCampaigns,
  getCampaignState,
  getDENSAddress,
  getDENSNames,
  getDenyListAddresses,
  getFeaturedAddresses,
  getTokenInfo,
  transformCampaign,
} from "@/services"
import { cosmWasmClient, cosmWasmQueryClient, cw20TokenBalance } from "@/state"
import { localStorageEffectJSON } from "@/state/effects"
import { CampaignActionType } from "@/types"

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

      if (!address) return { state: null, error: CommonError.InvalidAddress }

      const client = get(cosmWasmClient)
      if (!client) return { state: null, error: CommonError.GetClientFailed }

      try {
        return {
          state: await getCampaignState(client, address),
          error: null,
        }
      } catch (error) {
        console.error(error)
        return {
          state: null,
          error: parseError(error, {
            source: "campaignState",
            campaign: address,
          }),
        }
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
      if (!address) return { actions: null, error: CommonError.InvalidAddress }

      const { campaign, error: campaignError } = get(fetchCampaign(address))
      if (!campaign || campaignError)
        return { actions: null, error: campaignError }

      const client = get(cosmWasmClient)
      if (!client) return { actions: null, error: CommonError.GetClientFailed }

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
          let amount = convertMicroDenomToDenom(
            fund.wasm.attributes.find((a: any) => a.key === "amount")?.value,
            campaign.payToken.decimals
          )
          let address = fund.wasm.attributes.find(
            (a: any) => a.key === "sender"
          )?.value as string

          let when
          if (blockHeight !== null) {
            const elapsedTime = blockHeightToSeconds(blockHeight - fund.height)
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
          let amount = convertMicroDenomToDenom(
            fund.wasm.attributes.find((a: any) => a.key === "native_returned")
              ?.value,
            campaign.payToken.decimals
          )
          let address = fund.wasm.attributes.find(
            (a: any) => a.key === "sender"
          )?.value as string

          let when
          if (blockHeight !== null) {
            const elapsedTime = blockHeightToSeconds(blockHeight - fund.height)
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
        return {
          actions: null,
          error: parseError(error, {
            source: "fetchCampaignActions",
            campaign: address,
          }),
        }
      }
    },
})

export const fetchCampaign = selectorFamily<CampaignResponse, string>({
  key: "fetchCampaign",
  get:
    (address) =>
    async ({ get }) => {
      // Get campaign state.
      const { state, error: campaignStateError } = get(campaignState(address))
      if (campaignStateError || state === null)
        return { campaign: null, error: campaignStateError ?? "Unknown error." }

      // Get gov token balances.
      const {
        balance: campaignGovTokenBalance,
        error: campaignGovTokenBalanceError,
      } = get(
        cw20TokenBalance({
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
          cw20TokenBalance({
            tokenAddress: state.gov_token_addr,
            walletAddress: state.dao_addr,
          })
        )
      if (daoGovTokenBalanceError || daoGovTokenBalance === null)
        return {
          campaign: null,
          error: daoGovTokenBalanceError ?? "Unknown error.",
        }

      // Get featured addresses.
      const featuredAddresses = get(featuredCampaignAddressList)

      // Get deNS address map.
      const densAddressMap = get(fetchDENSAddressMap)

      // Transform data into campaign.
      const campaign = transformCampaign(
        address,
        state,
        campaignGovTokenBalance,
        daoGovTokenBalance,
        featuredAddresses,
        densAddressMap
      )

      if (!campaign) {
        console.error(
          parseError(
            "Transformed campaign is null.",
            {
              source: "fetchCampaign",
              campaign: address,
              campaignGovTokenBalance,
              daoGovTokenBalance,
            },
            { state }
          )
        )
      }

      return {
        campaign,
        error: campaign === null ? "Unknown error." : null,
      }
    },
})

export const tokenInfo = selectorFamily<TokenInfoSelectorResponse, string>({
  key: "tokenInfo",
  get:
    (address) =>
    async ({ get }) => {
      if (!address) return { info: null, error: CommonError.InvalidAddress }

      const client = get(cosmWasmClient)
      if (!client) return { info: null, error: CommonError.GetClientFailed }

      try {
        return {
          info: await getTokenInfo(client, address),
          error: null,
        }
      } catch (error) {
        console.error(error)
        return {
          info: null,
          error: parseError(error, {
            source: "tokenInfo",
            token: address,
          }),
        }
      }
    },
})

export const escrowContractAddresses = selectorFamily<
  QueryContractsByCodeResponse | undefined,
  { codeId: number; startAtKey?: number[] }
>({
  key: "escrowContractAddresses",
  get:
    ({ codeId, startAtKey }) =>
    async ({ get }) => {
      const queryClient = get(cosmWasmQueryClient)
      if (!queryClient) return

      return await queryClient.wasm.listContractsByCodeId(
        codeId,
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
      if (!queryClient) return { addresses, error: CommonError.GetClientFailed }

      let codeIdIndex = 0
      let startAtKey: number[] | undefined = undefined
      do {
        const addressDenyList = get(campaignDenyList)
        const response = get(
          escrowContractAddresses({
            codeId: escrowContractCodeIds[codeIdIndex],
            startAtKey: startAtKey && Array.from(startAtKey),
          })
        ) as QueryContractsByCodeResponse | undefined

        // If no response, move to next codeId.
        if (!response) {
          startAtKey = undefined
          codeIdIndex++
          continue
        }

        const contracts = response.contracts.filter(
          (a) => !addressDenyList.includes(a)
        )
        addresses.push(...contracts)
        startAtKey = Array.from(response.pagination?.nextKey ?? [])

        // If exhausted all addresses for this code ID, move on.
        if (!startAtKey.length) {
          codeIdIndex++
        }
      } while (
        // Keep going as long as there is another page key or the code ID is still valid.
        (!!startAtKey?.length || codeIdIndex < escrowContractCodeIds.length) &&
        // Keep going if not at pagination limit.
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
    if (!client) return []

    try {
      return await getDenyListAddresses(client)
    } catch (e) {
      console.error(e)
      return []
    }
  },
})

export const featuredCampaignAddressList = selector<string[]>({
  key: "featuredCampaignAddressList",
  get: async ({ get }) => {
    const client = get(cosmWasmClient)
    if (!client) return []

    try {
      return await getFeaturedAddresses(client)
    } catch (e) {
      console.error(e)
      return []
    }
  },
})

export const featuredCampaigns = selector<CampaignsResponse>({
  key: "featuredCampaigns",
  get: async ({ get }) => {
    const addresses = get(featuredCampaignAddressList)

    const campaignResponses = get(
      waitForAll(addresses.map((address) => fetchCampaign(address)))
    )
    const campaigns = campaignsFromResponses(campaignResponses, true, true)

    return { campaigns, hasMore: false, error: null }
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

        // If we got the asked-for page size, we might still have addresses left.
        addressesLeft = addresses.length === addressPageSize

        const campaignResponses = get(
          waitForAll(addresses.map((address) => fetchCampaign(address)))
        )

        let relevantCampaigns = campaignsFromResponses(
          campaignResponses,
          includeHidden,
          includePending
        )
        relevantCampaigns = await filterCampaigns(relevantCampaigns, filter)
        allCampaigns.push(...relevantCampaigns)

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

export const densCampaignAddress = selectorFamily<string | null, string>({
  key: "densCampaignAddress",
  get:
    (name) =>
    async ({ get }) => {
      const client = get(cosmWasmClient)
      if (!client) return null

      return await getDENSAddress(client, name)
    },
})

// Map from campaign address to name.
export const fetchDENSAddressMap = selector<DENSAddressMap>({
  key: "fetchDENSAddressMap",
  get: async ({ get }) => {
    const client = get(cosmWasmClient)
    if (!client) return {}

    const names = await getDENSNames(client)
    const addresses = get(
      waitForAll(names.map((name) => densCampaignAddress(name)))
    )

    return createDENSAddressMap(names, addresses)
  },
})
