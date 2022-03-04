import { ReactNode, useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { convertDenomToMicroDenom, parseError } from "@/helpers"
import { useRefreshCampaign, useWallet } from "@/hooks"
import {
  globalLoadingAtom,
  signedCosmWasmClient,
  tokenBalanceId,
} from "@/state"

export const useRefundCampaign = (campaign: Campaign | null) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { walletAddress } = useWallet()

  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [refundCampaignError, setRefundCampaignError] = useState(
    null as ReactNode | null
  )

  const setPayTokenBalanceId = useSetRecoilState(
    tokenBalanceId(campaign?.payToken.denom)
  )
  const refreshPayTokenBalance = useCallback(
    () => setPayTokenBalanceId((id) => id + 1),
    [setPayTokenBalanceId]
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
            amount: convertDenomToMicroDenom(
              amount,
              campaign.payToken.decimals
            ).toString(),
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

        // Update campaign state.
        refreshCampaign()

        // Refresh balance.
        refreshPayTokenBalance()

        return true
      } catch (error) {
        console.error(error)
        setRefundCampaignError(
          parseError(
            error,
            {
              source: "refundCampaign",
              wallet: walletAddress,
              campaign: campaign.address,
              amount,
            },
            undefined,
            undefined,
            true
          )
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
      refreshPayTokenBalance,
    ]
  )

  return { refundCampaign, refundCampaignError }
}
