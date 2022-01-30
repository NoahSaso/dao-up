import cn from "classnames"
import fuzzysort from "fuzzysort"
import type { NextPage } from "next"
import Image from "next/image"
import { FC, useEffect, useState } from "react"

import { CenteredColumn } from "../components"

interface Campaign {
  id: string
  name: string
  pledged: string
  funded: number
  description: string
}
interface CampaignProps {
  campaign: Campaign
}
const Campaign: FC<CampaignProps> = ({
  campaign: { name, pledged, funded, description },
}) => (
  <div
    className={cn(
      "flex flex-row justify-start items-stretch",
      "bg-card p-10 rounded-3xl",
      "border border-card hover:border-green",
      "transition"
    )}
  >
    <div className="bg-green w-[135px] h-[135px]"></div>
    <div className="ml-5">
      <h2 className="font-medium text-xl">{name}</h2>
      <p className="text-lg text-green">{pledged} $JUNO pledged</p>
      <p className="text-lg text-white">{funded}% funded</p>
      <p className="mt-5">{description}</p>
    </div>
  </div>
)

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "BongDAO",
    pledged: "100,000",
    funded: 10,
    description: "Lorem ipsum dolor sit amet, egestas...",
  },
  {
    id: "2",
    name: "HouseDAO",
    pledged: "500,000",
    funded: 50,
    description: "Lorem ipsum dolor sit amet, egestas...",
  },
  {
    id: "3",
    name: "RentDAO",
    pledged: "200,000",
    funded: 20,
    description: "Lorem ipsum dolor sit amet, egestas...",
  },
  {
    id: "4",
    name: "GroceryDAO",
    pledged: "900,000",
    funded: 90,
    description: "Lorem ipsum dolor sit amet, egestas...",
  },
  {
    id: "5",
    name: "MicroGridDAO",
    pledged: "1,200,000",
    funded: 120,
    description: "Lorem ipsum dolor sit amet, egestas...",
  },
]

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
