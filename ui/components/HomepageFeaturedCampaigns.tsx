import { FunctionComponent } from "react"
import { useRecoilValue } from "recoil"

import { HomepageFeaturedCampaignCard } from "@/components"
import { featuredCampaigns } from "@/state"

export const HomepageFeaturedCampaigns: FunctionComponent = () => {
  const { campaigns } = useRecoilValue(featuredCampaigns)

  return (
    <div className="flex flex-row gap-6 flex-wrap justify-center items-center">
      {(campaigns ?? []).map((campaign) => (
        <HomepageFeaturedCampaignCard
          key={campaign.address}
          campaign={campaign}
        />
      ))}
    </div>
  )
}
