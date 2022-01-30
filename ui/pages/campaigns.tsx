import cn from "classnames"
import fuzzysort from "fuzzysort"
import type { NextPage } from "next"
import Image from "next/image"
import { FC, useEffect, useState } from "react"

import { CenteredColumn } from "../components"
import { campaigns } from "../services/campaigns"

interface CampaignProps {
  campaign: Campaign
}
const Campaign: FC<CampaignProps> = ({
  campaign: { name, pledged, asset, goal, description },
}) => (
  <div
    className={cn(
      "flex flex-row justify-start items-stretch",
      "bg-card p-10 rounded-3xl",
      "border border-card hover:border-green",
      "transition",
      "cursor-pointer"
    )}
  >
    <div className="bg-green w-[135px] h-[135px]"></div>
    <div className="ml-5">
      <h2 className="font-medium text-xl">{name}</h2>
      <p className="text-lg text-green">
        {pledged.toLocaleString()} {asset} pledged
      </p>
      <p className="text-lg text-white">
        {((100 * pledged) / goal).toFixed(0)}% funded
      </p>
      <p className="mt-5">{description}</p>
    </div>
  </div>
)

let latestFilter = 0

const Campaigns: NextPage = () => {
  const [search, setSearch] = useState("")
  const [filteredCampaigns, setFilteredCampaigns] = useState(campaigns)

  // filter data for search
  useEffect(() => {
    let currFilter = ++latestFilter
    if (!search?.trim()) setFilteredCampaigns(campaigns)
    else
      fuzzysort
        .goAsync(search, campaigns, {
          keys: ["name", "description"],
          allowTypo: true,
        })
        .then((results) => {
          // if another filter is running, don't update
          if (currFilter !== latestFilter) return
          setFilteredCampaigns(results.map(({ obj }) => obj))
        })
  }, [search, setFilteredCampaigns])

  return (
    <>
      <div
        className={cn(
          "absolute top-0 right-0",
          "opacity-70",
          "w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3"
        )}
      >
        <Image
          src="/images/campaigns_orange_blur.png"
          alt=""
          width={406}
          height={626}
          layout="responsive"
        />
      </div>

      <CenteredColumn className="pt-5">
        <h1 className="font-semibold text-4xl">All Campaigns</h1>

        <input
          className={cn(
            "bg-card placeholder:text-placeholder",
            "mt-4 mb-6",
            "py-4 px-8",
            "w-full rounded-full",
            "border border-card focus:outline-none focus:border-green"
          )}
          type="text"
          placeholder="Search all campaigns..."
          value={search}
          onChange={({ target: { value } }) => setSearch(value)}
        />

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {filteredCampaigns.map((campaign) => (
            <Campaign key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </CenteredColumn>
    </>
  )
}

export default Campaigns
