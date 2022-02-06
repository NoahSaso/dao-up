import { coins } from "@cosmjs/stargate"
import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { defaultExecuteFee, fundingTokenDenom } from "../helpers/config"
import { globalLoadingAtom } from "../state/loading"
import { signedCosmWasmClient } from "../state/web3"
import useWallet from "./useWallet"

export const useContributeCampaign = () => {
  const { walletAddress } = useWallet()
  const client = useRecoilValue(signedCosmWasmClient)
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const [contributeCampaignError, setContributeCampaignError] = useState(
    null as string | null
  )

  const contributeCampaign = useCallback(
    async (campaign: Campaign, amount: number) => {
      if (!client) {
        setContributeCampaignError("Failed to get signing client.")
        return
      }
      if (!walletAddress) {
        setContributeCampaignError("Wallet not connected.")
        return
      }
      setLoading(true)

      try {
        const msg = {
          fund: {},
        }

        const response = await client.execute(
          walletAddress,
          campaign.address,
          msg,
          defaultExecuteFee,
          undefined,
          coins(amount * 1e6, fundingTokenDenom)
        )

        console.log(response)
      } catch (error) {
        console.error(error)
        // TODO: Set better error messages.
        setContributeCampaignError(`${error}`)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, client, walletAddress]
  )

  return { contributeCampaign, contributeCampaignError }
}
