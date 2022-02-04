import fuzzysort from "fuzzysort"
import { atom } from "jotai"

import { campaigns } from "../services/campaigns"
import { Status } from "../types"
import { globalLoadingAtom } from "./loading"
import {
  cosmWasmClientAtom,
  signedCosmWasmClientAtom,
  walletAddressAtom,
} from "./web3"

let lastCampaignId = campaigns.length

export const campaignFilterAtom = atom("")

// CREATE

export const createCampaignResultAtom = atom({
  isLoading: false,
  address: null,
} as AsAsyncAtom<{ address: string | null }>)

// Returns escrow contract address of deployed campaign.
export const createCampaignAtom = atom(
  (get) => get(createCampaignResultAtom),
  async (get, set, newCampaign: NewCampaign) => {
    try {
      // set(globalLoadingAtom, true)
      set(createCampaignResultAtom, { isLoading: true, address: null })

      const walletAddress = get(walletAddressAtom)
      if (!walletAddress) throw new Error("Wallet not connected.")

      const client = get(signedCosmWasmClientAtom)
      if (!client) throw new Error("Failed to get signing client.")

      // TODO: Deploy contract.

      const address = `junoescrow${++lastCampaignId}`

      campaigns.push({
        ...newCampaign,
        address,
        status: Status.Pending,
        creator: walletAddress,
        daoUrl: `https://daodao.zone/dao/${newCampaign.daoAddress}`,
        tokenPrice: 0,
        supporters: 0,
        pledged: 0,
        supply: 0,
        tokenName: "Token",
        tokenSymbol: "TOK",
        activity: [],
      })

      // simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Ensure always called, even on error.
      // set(globalLoadingAtom, false)
      set(createCampaignResultAtom, { isLoading: false, address })
    } catch (error) {
      console.error(error)
      set(createCampaignResultAtom, {
        isLoading: true,
        error: `${error}`,
        address: null,
      })
    }
  }
)

// GET

export const campaignAtom = atom({
  isLoading: false,
  campaign: null,
} as AsAsyncAtom<{ campaign: Campaign | null }>)

export const fetchCampaignAtom = atom(
  (get) => get(campaignAtom),
  async (get, set, address: string) => {
    try {
      const client = get(cosmWasmClientAtom)
      if (!client) throw new Error("Failed to get client.")

      set(globalLoadingAtom, true)
      set(campaignAtom, {
        isLoading: true,
        campaign: null,
      })

      // TODO: Get contract from chain and transform into Campaign type.
      // const contract = await client.getContract(escrowContractAddress)

      const campaign = campaigns.find((c) => c.address === address) ?? null

      // simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Ensure always called, even on error.
      set(globalLoadingAtom, false)
      set(campaignAtom, { isLoading: false, campaign })
    } catch (error) {
      console.error(error)
      set(campaignAtom, {
        isLoading: false,
        error: `${error}`,
        campaign: null,
      })
    }
  }
)

// GET ALL

// const CODE_ID = 0

export const campaignsAtom = atom(async (get) => {
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
})

export const visibleCampaignsAtom = atom(async (get) => {
  return get(campaignsAtom).filter((c) => c.displayPublicly)
})

export const filteredVisibleCampaignsAtom = atom(async (get) => {
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
})

export const walletCampaignsAtom = atom(async (get) => {
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
  }
  return {
    creatorCampaigns: [],
    contributorCampaigns: [],
  }
})
