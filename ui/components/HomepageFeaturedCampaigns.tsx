import { FunctionComponent } from "react"
import { useRecoilValue, waitForAll } from "recoil"
import { campaignsFromResponses } from "services/campaigns"
import { featuredCampaignAddressList, fetchCampaign } from "state/campaigns"
import { AllCampaignsCard } from "@/components"
import { HomepageFeaturedCampaignCard } from "./cards/CampaignCards"

export const HomepageFeaturedCampaigns: FunctionComponent = () => {
  const addresses = useRecoilValue(featuredCampaignAddressList)
  const hmm = useRecoilValue(
    waitForAll(addresses.map((addr) => fetchCampaign(addr)))
  )
  console.log(hmm)
  const campaigns = campaignsFromResponses(hmm, true, true)
  console.log(campaigns)
  return (
    <div className="flex flex-row gap-4 flex-wrap justify-center items-center">
      {campaigns.map((campaign) => (
        <HomepageFeaturedCampaignCard campaign={campaign} />
      ))}
    </div>
  )
}
