import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { parseError } from "@/helpers"
import { useRefreshCampaign, useWallet } from "@/hooks"
import { globalLoadingAtom, signedCosmWasmClient } from "@/state"

export const useRefundCampaign = (campaign: Campaign | null) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { walletAddress } = useWallet()

  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [refundCampaignError, setRefundCampaignError] = useState(
    null as string | null
  )

  const refundCampaign = useCallback(
    async (amount: number) => {
      setRefundCampaignError(null)

      if (!client) {
        setRefundCampaignError("Failed to get signing client.")
        return false
      }
      if (!walletAddress) {
        setRefundCampaignError("Wallet not connected.")
        return false
      }
      if (!campaign) {
        setRefundCampaignError("Campaign is not loaded.")
        return false
      }

      setLoading(true)

      try {
        const msg = {
          send: {
            contract: campaign.address,
            // Round so that this value is an integer in case JavaScript does any weird floating point stuff.
            amount: Math.round(amount * 1e6).toString(),
            msg: "",
          },
        }

        const response = await client.execute(
          walletAddress,
          campaign.fundingToken.address,
          msg,
          "auto",
          undefined
        )
        console.log(response)

        // Update campaign state.
        refreshCampaign()

        return true
      } catch (error) {
        console.error(error)
        setRefundCampaignError(
          parseError(error, {
            source: "refundCampaign",
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
      setRefundCampaignError,
      walletAddress,
      client,
    ]
  )

  return { refundCampaign, refundCampaignError }
}
