import { useSetRecoilState } from "recoil"

import { campaignStateId } from "../state/campaigns"

export const useRefreshCampaign = (campaign: Campaign | null) => {
  const setCampaignStateId = useSetRecoilState(
    campaignStateId(campaign?.address)
  )

  const refreshCampaign = () => {
    if (!campaign) return
    setCampaignStateId((id) => id + 1)
  }

  return { refreshCampaign }
}
