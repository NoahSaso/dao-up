import { toAscii, toBase64 } from "@cosmjs/encoding"
import { ReactNode, useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"

import { baseUrl } from "@/config"
import { CommonError, parseError } from "@/helpers"
import { useRefreshCampaign, useWallet } from "@/hooks"
import { createDAOProposalForCampaign } from "@/services"
import { daoConfig, feeManagerConfig, signedCosmWasmClient } from "@/state"

export const useUpdateCampaign = (
  campaign: Campaign | null,
  onSuccess: (proposalId: string) => void
) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { config: dao } = useRecoilValue(daoConfig(campaign?.dao.address))
  const { walletAddress } = useWallet()
  const feeConfig = useRecoilValue(feeManagerConfig)

  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [editCampaignError, setEditCampaignError] = useState(
    null as ReactNode | null
  )

  const editCampaign = useCallback(
    async (updateCampaign: UpdateCampaignInfo) => {
      setEditCampaignError(null)

      if (!client) {
        setEditCampaignError("Failed to get signing client.")
        return
      }
      if (!walletAddress) {
        setEditCampaignError("Wallet not connected.")
        return
      }
      if (!campaign) {
        setEditCampaignError("Campaign is not loaded.")
        return
      }
      if (!dao?.config) {
        setEditCampaignError("DAO could not be found.")
        return
      }
      if (!feeConfig) {
        setEditCampaignError("Config not loaded.")
        return
      }

      const cosmMsg = {
        wasm: {
          execute: {
            contract_addr: campaign.address,
            msg: toBase64(
              toAscii(
                JSON.stringify({
                  update_campaign: {
                    campaign: {
                      name: updateCampaign.name,
                      description: updateCampaign.description,
                      hidden: updateCampaign.hidden,

                      ...(updateCampaign.website && {
                        website: updateCampaign.website,
                      }),
                      ...(updateCampaign.twitter && {
                        twitter: updateCampaign.twitter,
                      }),
                      ...(updateCampaign.discord && {
                        discord: updateCampaign.discord,
                      }),

                      ...(updateCampaign.profileImageUrl && {
                        profile_image_url: updateCampaign.profileImageUrl,
                      }),
                      description_image_urls:
                        updateCampaign.descriptionImageUrls,
                    },
                  },
                })
              )
            ),
            funds:
              // If changing displaying publicly and uses fee manager and fee exists, send fee.
              !updateCampaign.hidden &&
              campaign.hidden &&
              campaign.feeManagerAddress &&
              feeConfig.publicListingFee.coin.amount !== "0"
                ? [feeConfig.publicListingFee.coin]
                : [],
          },
        },
      }

      const msg = {
        propose: {
          title: "Update DAO Up! campaign",
          description: `Update properties of the [${campaign.name}](${
            baseUrl + campaign.urlPath
          }) campaign on DAO Up!`,
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

        onSuccess(proposalId)
      } catch (error) {
        console.error(error)
        // If the campaign was not created successfully, error will show.
        setEditCampaignError(
          parseError(
            error,
            {
              source: "editCampaign",
              wallet: walletAddress,
              campaign: campaign.address,
            },
            {
              transform: {
                [CommonError.Unauthorized]:
                  "Unauthorized. You must stake tokens in the DAO on DAO DAO before you can create a proposal.",
              },
              includeTimeoutError: true,
            }
          )
        )
      }
    },
    [
      campaign,
      dao,
      client,
      walletAddress,
      feeConfig,
      refreshCampaign,
      setEditCampaignError,
      onSuccess,
    ]
  )

  const defaultEditCampaign: Partial<UpdateCampaignInfo> = useMemo(
    () =>
      campaign
        ? {
            name: campaign.name,
            description: campaign.description,
            profileImageUrl: campaign.profileImageUrl ?? undefined,
            _descriptionImageUrls: campaign.descriptionImageUrls.map((url) => ({
              url,
            })),
            website: campaign.website ?? undefined,
            twitter: campaign.twitter ?? undefined,
            discord: campaign.discord ?? undefined,
            hidden: campaign.hidden,
          }
        : {},
    [campaign]
  )

  return { editCampaign, editCampaignError, defaultEditCampaign }
}
