import { useCallback } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { campaigns } from "../services/campaigns"
import { Status } from "../types"
import { globalLoadingAtom } from "./../state/loading"
import { signedCosmWasmClient } from "./../state/web3"

let lastCampaignId = campaigns.length

export const useCreateCampaign = (walletAddress: string | undefined) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const setLoading = useSetRecoilState(globalLoadingAtom)

  const createCampaign = useCallback(
    async (newCampaign: NewCampaign) => {
      setLoading(true)

      try {
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
      } finally {
        setLoading(false)
      }
    },
    [setLoading, client, walletAddress]
  )

  return createCampaign
}
