import { coins } from "@cosmjs/stargate"
import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { convertDenomToMicroDenom, parseError } from "@/helpers"
import { useRefreshCampaign, useWallet } from "@/hooks"
import { globalLoadingAtom, signedCosmWasmClient } from "@/state"

export const useContributeCampaign = (campaign: Campaign | null) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { walletAddress } = useWallet()

  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [contributeCampaignError, setContributeCampaignError] = useState(
    null as string | null
  )

  const contributeCampaign = useCallback(
    async (amount: number) => {
      setContributeCampaignError(null)

      if (!client) {
        setContributeCampaignError("Failed to get signing client.")
        return false
      }
      if (!walletAddress) {
        setContributeCampaignError("Wallet not connected.")
        return false
      }
      if (!campaign) {
        setContributeCampaignError("Campaign is not loaded.")
        return false
      }

      setLoading(true)

      try {
        const msg = {
          fund: {},
        }

        await client.execute(
          walletAddress,
          campaign.address,
          msg,
          "auto",
          undefined,
          coins(
            convertDenomToMicroDenom(amount, campaign.payToken.decimals),
            campaign.payToken.denom
          )
        )

        // Update campaign state.
        refreshCampaign()

        return true
      } catch (error) {
        console.error(error)
        setContributeCampaignError(
          parseError(error, {
            source: "contributeCampaign",
            wallet: walletAddress,
            campaign: campaign.address,
            amount,
          })
        )
        return false
      } finally {
        setLoading(false)
      }
    },
    [
      setLoading,
      campaign,
      refreshCampaign,
      setContributeCampaignError,
      walletAddress,
      client,
    ]
  )

  return { contributeCampaign, contributeCampaignError }
}
