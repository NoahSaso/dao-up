import fuzzysort from "fuzzysort"
import { atom, selector, selectorFamily } from "recoil"

import { campaigns } from "../services/campaigns"
import { cosmWasmClient, walletAddress } from "./web3"

export const campaignFilterAtom = atom({
  key: "campaignFilter",
  default: "",
})

// GET

export const fetchCampaign = selectorFamily({
  key: "fetchCampaign",
  get:
    (address: string) =>
    async ({ get }) => {
      try {
        if (!address) throw new Error("Invalid address.")

        const client = get(cosmWasmClient)
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

export const allCampaigns = selector({
  key: "campaigns",
  get: async ({ get }) => {
    try {
      const client = get(cosmWasmClient)
      if (!client) throw new Error("Failed to get client.")

      // TODO: Get contracts from chain and transform into Campaign types.
      // const contract = await client.getContracts(CODE_ID)

      // simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return campaigns
    } catch (error) {
      console.error(error)
      // TODO: Display error.

      return []
    }
  },
})

export const visibleCampaigns = selector({
  key: "visibleCampaigns",
  get: ({ get }) => get(allCampaigns).filter((c) => !c.hidden),
})

export const filteredVisibleCampaigns = selector({
  key: "filteredVisibleCampaigns",
  get: async ({ get }) => {
    const filter = get(campaignFilterAtom)
    let campaigns = get(visibleCampaigns)

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

export const walletCampaigns = selector({
  key: "walletCampaigns",
  get: async ({ get }) => {
    try {
      const address = get(walletAddress)
      if (!address) throw new Error("Wallet not connected.")

      const campaigns = get(allCampaigns)

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
        creatorCampaigns,
        contributorCampaigns,
      }
    } catch (error) {
      // await error so we don't render empty data while walletAddress loads
      // TODO: BIG OOF TO AWAITING ERROR PATTERN
      await error

      console.error(error)
      // TODO: Display error.

      return {
        creatorCampaigns: [],
        contributorCampaigns: [],
      }
    }
  },
})
