import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { campaigns } from "../services/campaigns"
import { globalLoadingAtom } from "../state/loading"
import { signedCosmWasmClient } from "../state/web3"
import { Status } from "../types"

let lastCampaignId = campaigns.length

export const useCreateCampaign = (walletAddress: string | undefined) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const [createCampaignError, setCreateCampaignError] = useState(
    null as string | null
  )

  // hideLoadingAfter determines whether or not to hide the loading screen when the contract creation succeeds.
  // This may be useful if you want to run some actions before hiding the loader, such as changing screens.
  const createCampaign = useCallback(
    async (newCampaign: NewCampaign, hideLoadingAfter: boolean = true) => {
      if (!client) {
        setCreateCampaignError("Failed to get signing client.")
        return
      }
      if (!walletAddress) {
        setCreateCampaignError("Wallet not connected.")
        return
      }
      setLoading(true)

      try {
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

        return address
      } catch (error) {
        // TODO: Set better error messages.
        setCreateCampaignError(`${error}`)
      } finally {
        if (hideLoadingAfter) setLoading(false)
      }
    },
    [setLoading, client, walletAddress]
  )

  return { createCampaign, createCampaignError, setLoading }
}
