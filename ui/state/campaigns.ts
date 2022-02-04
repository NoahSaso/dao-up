import fuzzysort from "fuzzysort"
import { atom, selector, selectorFamily } from "recoil"

import { campaigns } from "../services/campaigns"
import { cosmWasmClientAtom, walletAddressAtom } from "./web3"

export const campaignFilterAtom = atom({
  key: "campaignFilter",
  default: "",
})

// GET

export const fetchCampaignAtom = selectorFamily({
  key: "fetchCampaign",
  get:
    (address: string) =>
    async ({ get }) => {
      try {
        if (!address) throw new Error("Invalid address.")

        const client = get(cosmWasmClientAtom)
        if (!client) throw new Error("Failed to get client.")

        // TODO: Get contract from chain and transform into Campaign type.
        // const contract = await client.getContract(escrowContractAddress)

        const campaign = campaigns.find((c) => c.address === address) ?? null

        // simulate loading
        await new Promise((resolve) => setTimeout(resolve, 1000))

        return campaign
      } catch (error) {
        console.error(error)
        // TODO: Display error
      }
    },
})

// GET ALL

// const CODE_ID = 0

export const campaignsAtom = selector({
  key: "campaigns",
  get: async ({ get }) => {
    try {
      const client = get(cosmWasmClientAtom)
      if (!client) throw new Error("Failed to get client.")

      // TODO: Get contracts from chain and transform into Campaign types.
      // const contract = await client.getContracts(CODE_ID)

      // simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return campaigns
    } catch (error) {
      console.error(error)
      // TODO: Display error.
    }
    return []
  },
})

export const visibleCampaignsAtom = selector({
  key: "visibleCampaigns",
  get: ({ get }) => get(campaignsAtom).filter((c) => c.displayPublicly),
})

export const filteredVisibleCampaignsAtom = selector({
  key: "filteredVisibleCampaigns",
  get: async ({ get }) => {
    const filter = get(campaignFilterAtom)
    let campaigns = get(visibleCampaignsAtom)

    if (filter)
      campaigns = fuzzysort
        .go(filter, campaigns, {
          keys: ["name", "description"],
          allowTypo: true,
        })
        .map(({ obj }) => obj)

    return campaigns
  },
})

export const walletCampaignsAtom = selector({
  key: "walletCampaigns",
  get: async ({ get }) => {
    try {
      const walletAddress = get(walletAddressAtom)
      if (!walletAddress) throw new Error("Wallet not connected.")

      const campaigns = get(campaignsAtom)

      const creatorCampaigns = campaigns.filter(
        (c) => c.creator === walletAddress
      )
      // TODO: Somehow figure out if this wallet is a supporter.
      const contributorCampaigns = campaigns.filter(
        (c) =>
          // c.contributors.includes(address)
          c.creator !== walletAddress
      )

      return {
        creatorCampaigns,
        contributorCampaigns,
      }
    } catch (error) {
      console.error(error)
      // TODO: Display error.

      return {
        creatorCampaigns: [],
        contributorCampaigns: [],
      }
    }
  },
})
