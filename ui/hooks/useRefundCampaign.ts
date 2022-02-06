import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { defaultExecuteFee } from "../helpers/config"
import { globalLoadingAtom } from "../state/loading"
import { signedCosmWasmClient } from "../state/web3"
import useWallet from "./useWallet"

export const useRefundCampaign = () => {
  const { walletAddress } = useWallet()
  const client = useRecoilValue(signedCosmWasmClient)
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const [refundCampaignError, setRefundCampaignError] = useState(
    null as string | null
  )

  const refundCampaign = useCallback(
    async (campaign: Campaign, amount: number) => {
      if (!client) {
        setRefundCampaignError("Failed to get signing client.")
        return
      }
      if (!walletAddress) {
        setRefundCampaignError("Wallet not connected.")
        return
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
      } catch (error) {
        console.error(error)
        // TODO: Set better error messages.
        setRefundCampaignError(`${error}`)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, client, walletAddress]
  )

  return { refundCampaign, refundCampaignError }
}
