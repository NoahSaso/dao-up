import fuzzysort from "fuzzysort"
import { atom, selector, selectorFamily } from "recoil"

import { campaigns } from "../services/campaigns"
import { cosmWasmClient, walletAddress } from "./web3"

export const campaignFilterAtom = atom({
  key: "campaignFilter",
  default: "",
})

// GET

export const fetchCampaign = selectorFamily<CampaignResponse, string>({
  key: "fetchCampaign",
  get:
    (address) =>
    async ({ get }) => {
      const client = get(cosmWasmClient)
      if (!client) throw new Error("Failed to get client.")
      if (!address) throw new Error("Invalid address.")

      try {
        // TODO: Get contract from chain and transform into Campaign type.
        // const contract = await client.getContract(escrowContractAddress)

        const campaign = campaigns.find((c) => c.address === address) ?? null

        // simulate loading
        await new Promise((resolve) => setTimeout(resolve, 1000))

        return {
          campaign,
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

// const CODE_ID = 0

export const allCampaigns = selector<CampaignsResponse>({
  key: "campaigns",
  get: async ({ get }) => {
    const client = get(cosmWasmClient)
    if (!client) throw new Error("Failed to get client.")

    try {
      // TODO: Get contracts from chain and transform into Campaign types.
      // const contract = await client.getContracts(CODE_ID)

      // simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return { campaigns, error: null }
    } catch (error) {
      console.error(error)
      // TODO: Return better error.
      return { campaigns: [], error: `${error}` }
    }
  },
})

export const visibleCampaigns = selector<CampaignsResponse>({
  key: "visibleCampaigns",
  get: ({ get }) => {
    const { campaigns, ...response } = get(allCampaigns)
    return {
      ...response,
      campaigns: campaigns.filter((c) => !c.hidden),
    }
  },
})

export const filteredVisibleCampaigns = selector<CampaignsResponse>({
  key: "filteredVisibleCampaigns",
  get: async ({ get }) => {
    const filter = get(campaignFilterAtom)
    const response = get(visibleCampaigns)

    let { campaigns } = response
    if (filter)
      campaigns = fuzzysort
        .go(filter, campaigns, {
          keys: ["name", "description"],
          allowTypo: true,
        })
        .map(({ obj }) => obj)

    return {
      ...response,
      campaigns,
    }
  },
})

export const walletCampaigns = selector<WalletCampaignsResponse>({
  key: "walletCampaigns",
  get: async ({ get }) => {
    const address = get(walletAddress)
    if (!address) throw new Error("Wallet not connected.")

    const { campaigns, ...response } = get(allCampaigns)

    try {
      const creatorCampaigns = campaigns.filter((c) => c.creator === address)
      // TODO: Somehow figure out if this wallet is a supporter.
      const contributorCampaigns = campaigns.filter(
        (c) =>
          // c.contributors.includes(address)
          c.creator !== address
      )

      // simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        ...response,
        creatorCampaigns,
        contributorCampaigns,
      }
    } catch (error) {
      console.error(error)
      // TODO: Return better error.
      return {
        creatorCampaigns: [],
        contributorCampaigns: [],
        error: `${error}`,
      }
    }
  },
})
