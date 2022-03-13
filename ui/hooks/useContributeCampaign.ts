import { coins } from "@cosmjs/stargate"
import { Dispatch, ReactNode, SetStateAction, useCallback } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { CommonError, convertDenomToMicroDenom, parseError } from "@/helpers"
import { useRefreshCampaign, useWallet } from "@/hooks"
import {
  globalLoadingAtom,
  nativeWalletTokenBalance,
  signedCosmWasmClient,
  tokenBalanceId,
} from "@/state"

export const useContributeCampaign = (
  campaign: Campaign | null,
  setError: Dispatch<SetStateAction<ReactNode | null>>
) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { walletAddress } = useWallet()

  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)

  const { balance } = useRecoilValue(
    nativeWalletTokenBalance(campaign?.payToken?.denom)
  )
  const setPayTokenBalanceId = useSetRecoilState(
    tokenBalanceId(campaign?.payToken.denom)
  )
  const refreshPayTokenBalance = useCallback(
    () => setPayTokenBalanceId((id) => id + 1),
    [setPayTokenBalanceId]
  )

  const contributeCampaign = useCallback(
    async (amount: number) => {
      setError(null)

      if (!client) {
        setError("Failed to get signing client.")
        return false
      }
      if (!walletAddress) {
        setError("Wallet not connected.")
        return false
      }
      if (!campaign) {
        setError("Campaign is not loaded.")
        return false
      }
      if (balance === null) {
        setError("Could not check balance.")
        return false
      }
      if (amount > balance) {
        setError(CommonError.InsufficientFunds)
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

        // Refresh balance.
        refreshPayTokenBalance()

        return true
      } catch (error) {
        console.error(error)
        setError(
          parseError(
            error,
            {
              source: "contributeCampaign",
              wallet: walletAddress,
              campaign: campaign.address,
              amount,
            },
            { includeTimeoutError: true }
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
      setError,
      walletAddress,
      client,
      balance,
      refreshPayTokenBalance,
    ]
  )

  return contributeCampaign
}
