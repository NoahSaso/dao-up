import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { defaultExecuteFee } from "../helpers/config"
import { globalLoadingAtom } from "../state/loading"
import { signedCosmWasmClient } from "../state/web3"
import { useRefreshCampaign } from "./useRefreshCampaign"
import useWallet from "./useWallet"

export const useRefundCampaign = (campaign: Campaign | null) => {
  const { walletAddress } = useWallet()
  const client = useRecoilValue(signedCosmWasmClient)
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const [refundCampaignError, setRefundCampaignError] = useState(
    null as string | null
  )
  const { refreshCampaign } = useRefreshCampaign(campaign)

  const refundCampaign = useCallback(
    async (amount: number) => {
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
            amount: `${amount * 1e6}`,
            msg: "",
          },
        }

        const response = await client.execute(
          walletAddress,
          campaign.fundingToken.address,
          msg,
          defaultExecuteFee,
          undefined
        )
        console.log(response)

        // Update campaign state.
        refreshCampaign()

        return true
      } catch (error) {
        console.error(error)
        // TODO: Set better error messages.
        setRefundCampaignError(`${error}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, client, walletAddress, campaign, refreshCampaign]
  )

  return { refundCampaign, refundCampaignError }
}
