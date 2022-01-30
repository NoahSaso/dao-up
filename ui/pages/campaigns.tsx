import fuzzysort from "fuzzysort"
import type { NextPage } from "next"
import Image from "next/image"
import { useEffect, useState } from "react"

import {
  AllCampaignsCard,
  CenteredColumn,
  Input,
  ResponsiveDecoration,
} from "../components"
import { campaigns } from "../services/campaigns"

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
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-5">
        <h1 className="font-semibold text-4xl">All Campaigns</h1>

        <Input
          className="mt-4 mb-6 w-full"
          type="text"
          placeholder="Search all campaigns..."
          value={search}
          onChange={({ target: { value } }) => setSearch(value)}
        />

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {filteredCampaigns.map((campaign) => (
            <AllCampaignsCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </CenteredColumn>
    </>
  )
}

export default Campaigns
