import { toAscii, toBase64 } from "@cosmjs/encoding"
import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"

import { baseUrl } from "@/config"
import {
  convertDenomToMicroDenom,
  parseError,
  prettyPrintDecimal,
} from "@/helpers"
import { useRefreshCampaign, useWallet } from "@/hooks"
import { createDAOProposalForCampaign } from "@/services"
import { daoConfig, globalLoadingAtom, signedCosmWasmClient } from "@/state"
import { CommonError } from "@/types"

export const useProposeFundPendingCampaign = (campaign: Campaign | null) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { config: dao } = useRecoilValue(daoConfig(campaign?.dao.address))
  const { walletAddress } = useWallet()

  const setLoading = useSetRecoilState(globalLoadingAtom)
  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [fundPendingCampaignError, setProposeFundPendingCampaignError] =
    useState(null as string | null)

  const fundPendingCampaign = useCallback(
    async (amount: number) => {
      setProposeFundPendingCampaignError(null)

      if (!client) {
        setProposeFundPendingCampaignError("Failed to get signing client.")
        return false
      }
      if (!walletAddress) {
        setProposeFundPendingCampaignError("Wallet not connected.")
        return false
      }
      if (!campaign) {
        setProposeFundPendingCampaignError("Campaign is not loaded.")
        return false
      }
      if (!dao?.config) {
        setProposeFundPendingCampaignError("DAO could not be found.")
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
                    amount: convertDenomToMicroDenom(
                      amount,
                      campaign.payToken.decimals
                    ).toString(),
                    msg: "",
                  },
                })
              )
            ),
            funds: [],
          },
        },
      }

      const msg = {
        propose: {
          title: "Activate DAO Up! campaign",
          description: `Send ${prettyPrintDecimal(amount)} ${
            campaign.govToken.symbol
          } to the [${campaign.name}](${
            baseUrl + campaign.urlPath
          }) campaign on DAO Up! in order to launch it.`,
          msgs: [cosmMsg],
        },
      }

      try {
        const proposalId = await createDAOProposalForCampaign(
          client,
          walletAddress,
          campaign,
          dao,
          msg
        )

        // Update campaign state.
        refreshCampaign()

        return proposalId
      } catch (error) {
        console.error(error)
        setProposeFundPendingCampaignError(
          parseError(
            error,
            {
              source: "fundPendingCampaign",
              wallet: walletAddress,
              campaign: campaign.address,
              amount,
            },
            {
              [CommonError.Unauthorized]:
                "Unauthorized. You must stake tokens in the DAO on DAO DAO before you can create a proposal.",
            }
          )
        )
      } finally {
        setLoading(false)
      }
    },
    [
      setLoading,
      campaign,
      dao,
      refreshCampaign,
      setProposeFundPendingCampaignError,
      walletAddress,
      client,
    ]
  )

  return { fundPendingCampaign, fundPendingCampaignError }
}
