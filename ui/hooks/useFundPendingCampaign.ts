import { toAscii, toBase64 } from "@cosmjs/encoding"
import { findAttribute } from "@cosmjs/stargate/build/logs"
import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { defaultExecuteFee } from "../config"
import { prettyPrintDecimal } from "../helpers"
import { globalLoadingAtom, signedCosmWasmClient } from "../state"
import { useRefreshCampaign, useWallet } from "."

export const useFundPendingCampaign = (campaign: Campaign | null) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { walletAddress } = useWallet()

  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [fundPendingCampaignError, setFundPendingCampaignError] = useState(
    null as string | null
  )

  const fundPendingCampaign = useCallback(
    async (amount: number) => {
      setFundPendingCampaignError(null)

      if (!client) {
        setFundPendingCampaignError("Failed to get signing client.")
        return false
      }
      if (!walletAddress) {
        setFundPendingCampaignError("Wallet not connected.")
        return false
      }
      if (!campaign) {
        setFundPendingCampaignError("Campaign is not loaded.")
        return false
      }

      setLoading(true)
      const cosmMsg = {
        wasm: {
          execute: {
            contract_addr: campaign.govToken.address,
            msg: toBase64(
              toAscii(
                JSON.stringify({
                  send: {
                    contract: campaign.address,
                    amount: (amount * 1e6).toString(),
                    msg: "",
                  },
                })
              )
            ),
            funds: [],
          },
        },
      }

      try {
        const msg = {
          propose: {
            title: `Activate DAO Up! campaign`,
            description: `Send ${prettyPrintDecimal(amount)} ${
              campaign.govToken.symbol
            } to the [${campaign.name}](https://daoup.zone/campaign/${
              campaign.address
            }) campaign on DAO Up! in order to launch it.`,
            msgs: [cosmMsg],
          },
        }

        const response = await client.execute(
          walletAddress,
          campaign.dao.address,
          msg,
          defaultExecuteFee
        )

        const proposalId = findAttribute(
          response.logs,
          "wasm",
          "proposal_id"
        ).value

        // Update campaign state.
        refreshCampaign()

        return proposalId
      } catch (error) {
        console.error(error)
        // TODO: Set better error messages.
        setFundPendingCampaignError(`${error}`)
      } finally {
        setLoading(false)
      }
    },
    [
      setLoading,
      campaign,
      refreshCampaign,
      setFundPendingCampaignError,
      walletAddress,
      client,
    ]
  )

  return { fundPendingCampaign, fundPendingCampaignError }
}
