import { useSetRecoilState } from "recoil"

import { campaignStateId, tokenAddressBalanceId } from "../state"

export const useRefreshCampaign = (campaign: Campaign | null) => {
  const setCampaignStateId = useSetRecoilState(
    campaignStateId(campaign?.address)
  )
  const setFundingTokenAddressBalanceId = useSetRecoilState(
    tokenAddressBalanceId(campaign?.fundingToken.address)
  )

  const refreshCampaign = () => {
    if (!campaign) return
    // Refresh campaign data.
    setCampaignStateId((id) => id + 1)
    // Refresh funding token balances (in the case of contributing or refunding, this will update the wallet balance displayed).
    setFundingTokenAddressBalanceId((id) => id + 1)
  }

  return { refreshCampaign }
}
