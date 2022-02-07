import { coins } from "@cosmjs/stargate"
import { useState } from "react"
import { useRecoilCallback, useSetRecoilState } from "recoil"

import { defaultExecuteFee, fundingTokenDenom } from "../helpers/config"
import { globalLoadingAtom } from "../state/loading"
import { signedCosmWasmClient, walletAddress } from "../state/web3"
import { useRefreshCampaign } from "./useRefreshCampaign"

export const useContributeCampaign = (campaign: Campaign | null) => {
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [contributeCampaignError, setContributeCampaignError] = useState(
    null as string | null
  )

  const contributeCampaign = useRecoilCallback(
    ({ snapshot }) =>
      async (amount: number) => {
        setContributeCampaignError(null)

        if (!campaign) {
          setContributeCampaignError("Campaign is not loaded.")
          return false
        }

        const client = await snapshot.getPromise(signedCosmWasmClient)
        const wAddress = await snapshot.getPromise(walletAddress)
        if (!client) {
          setContributeCampaignError("Failed to get signing client.")
          return false
        }
        if (!wAddress) {
          setContributeCampaignError("Wallet not connected.")
          return false
        }

        setLoading(true)

        try {
          const msg = {
            fund: {},
          }

          const response = await client.execute(
            wAddress,
            campaign.address,
            msg,
            defaultExecuteFee,
            undefined,
            coins(amount * 1e6, fundingTokenDenom)
          )
          console.log(response)

          // Update campaign state.
          refreshCampaign()

          return true
        } catch (error) {
          console.error(error)
          // TODO: Set better error messages.
          setContributeCampaignError(`${error}`)
          return false
        } finally {
          setLoading(false)
        }
      },
    [setLoading, campaign, refreshCampaign, setContributeCampaignError]
  )

  return { contributeCampaign, contributeCampaignError }
}
