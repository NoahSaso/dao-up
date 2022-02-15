import { useSetRecoilState } from "recoil"

import { campaignStateId, tokenAddressBalanceId } from "@/state"

export const useRefreshCampaign = (campaign: Campaign | null) => {
  const setCampaignStateId = useSetRecoilState(
    campaignStateId(campaign?.address)
  )
  const setFundingTokenAddressBalanceId = useSetRecoilState(
    tokenAddressBalanceId(campaign?.fundingToken.address)
  )
  const setGovTokenAddressBalanceId = useSetRecoilState(
    tokenAddressBalanceId(campaign?.govToken.address)
  )

  const refreshCampaign = () => {
    if (!campaign) return
    // Refresh campaign data.
    setCampaignStateId((id) => id + 1)
    // Refresh funding token balance (in the case of contributing or refunding, this will update the wallet balance displayed).
    setFundingTokenAddressBalanceId((id) => id + 1)
    // Refresh governance token balance (in the case of joining the DAO, this will update the wallet balance displayed).
    setGovTokenAddressBalanceId((id) => id + 1)
  }

  return { refreshCampaign }
}
