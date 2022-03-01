import { toAscii, toBase64 } from "@cosmjs/encoding"
import { useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"

import { baseUrl } from "@/config"
import { parseError } from "@/helpers"
import { useRefreshCampaign, useWallet } from "@/hooks"
import { createDAOProposalForCampaign } from "@/services"
import { daoConfig, signedCosmWasmClient } from "@/state"
import { CommonError } from "@/types"

export const useUpdateCampaign = (
  campaign: Campaign | null,
  onSuccess: (proposalId: string) => void
) => {
  const client = useRecoilValue(signedCosmWasmClient)
  const { config: dao } = useRecoilValue(daoConfig(campaign?.dao.address))
  const { walletAddress } = useWallet()

  const { refreshCampaign } = useRefreshCampaign(campaign)
  const [editCampaignError, setEditCampaignError] = useState(
    null as string | null
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
        return false
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
            funds: [],
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
              [CommonError.Unauthorized]:
                "Unauthorized. You must stake tokens in the DAO on DAO DAO before you can create a proposal.",
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
