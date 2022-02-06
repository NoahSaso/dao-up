import { coin } from "@cosmjs/stargate"
import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import {
  cw20CodeId,
  defaultExecuteFee,
  escrowContractCodeId,
  fundingTokenDenom,
} from "../helpers/config"
import { globalLoadingAtom } from "../state/loading"
import { signedCosmWasmClient } from "../state/web3"

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
        const msg = {
          dao_address: newCampaign.daoAddress,
          cw20_code_id: cw20CodeId,

          funding_goal: coin(newCampaign.goal * 1e6, fundingTokenDenom),
          funding_token_name: newCampaign.tokenName,
          funding_token_symbol: newCampaign.tokenSymbol,

          campaign_info: {
            name: newCampaign.name,
            description: newCampaign.description,
            hidden: newCampaign.hidden,

            ...(newCampaign.imageUrl && { image_url: newCampaign.imageUrl }),
            ...(newCampaign.website && { website: newCampaign.website }),
            ...(newCampaign.twitter && { twitter: newCampaign.twitter }),
            ...(newCampaign.discord && { discord: newCampaign.discord }),
          },
        }

        const { contractAddress } = await client.instantiate(
          walletAddress,
          escrowContractCodeId,
          msg,
          `[DAO Up!] ${newCampaign.name}`,
          defaultExecuteFee
        )

        console.log(contractAddress)

        return contractAddress
      } catch (error) {
        console.error(error)
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
