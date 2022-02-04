import { useCallback } from "react"
import { useRecoilValue } from "recoil"

import { campaigns } from "../services/campaigns"
import { Status } from "../types"
import { signedCosmWasmClientAtom } from "./../state/web3"

let lastCampaignId = campaigns.length - 1

export const useCampaign = (walletAddress: string | undefined) => {
  const client = useRecoilValue(signedCosmWasmClientAtom)

  const createCampaign = useCallback(
    async (newCampaign: NewCampaign) => {
      if (!client) throw new Error("Failed to get signing client.")
      if (!walletAddress) throw new Error("Wallet not connected.")

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
      // set(createCampaignResultAtom, { isLoading: false, address })

      return address
    },
    [client, walletAddress]
  )

  return { createCampaign }
}
