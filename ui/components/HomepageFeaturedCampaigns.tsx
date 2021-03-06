import { FunctionComponent } from "react"
import { useRecoilValue } from "recoil"

import { Carousel, HomepageFeaturedCampaignCard } from "@/components"
import { featuredCampaigns } from "@/state"

export const HomepageFeaturedCampaigns: FunctionComponent = () => {
  const { campaigns } = useRecoilValue(featuredCampaigns)

  return campaigns?.length ? (
    <Carousel childContainerClassName="w-full xs:w-auto">
      {campaigns.map((campaign) => (
        <HomepageFeaturedCampaignCard
          key={campaign.address}
          campaign={campaign}
        />
      ))}
    </Carousel>
  ) : null
}
