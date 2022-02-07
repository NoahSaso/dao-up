import { useState } from "react"
import { useRecoilCallback, useSetRecoilState } from "recoil"

import { defaultExecuteFee } from "../helpers/config"
import { globalLoadingAtom } from "../state/loading"
import { signedCosmWasmClient, walletAddress } from "../state/web3"
import { useRefreshCampaign } from "./useRefreshCampaign"

export const useRefundCampaign = (campaign: Campaign | null) => {
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [refundCampaignError, setRefundCampaignError] = useState(
    null as string | null
  )

  const refundCampaign = useRecoilCallback(
    ({ snapshot }) =>
      async (amount: number) => {
        setRefundCampaignError(null)

        if (!campaign) {
          setRefundCampaignError("Campaign is not loaded.")
          return false
        }

        const client = await snapshot.getPromise(signedCosmWasmClient)
        const wAddress = await snapshot.getPromise(walletAddress)
        if (!client) {
          setRefundCampaignError("Failed to get signing client.")
          return false
        }
        if (!wAddress) {
          setRefundCampaignError("Wallet not connected.")
          return false
        }

        setLoading(true)

        try {
          const msg = {
            send: {
              contract: campaign.address,
              amount: `${(amount * 1e6).toFixed(0)}`,
              msg: "",
            },
          }

          const response = await client.execute(
            wAddress,
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
    [setLoading, campaign, refreshCampaign, setRefundCampaignError]
  )

  return { refundCampaign, refundCampaignError }
}
