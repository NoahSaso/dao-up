import fuzzysort from "fuzzysort"
import type { NextPage } from "next"
import { FC, PropsWithChildren, useEffect, useState } from "react"

import {
  AllCampaignsCard,
  CenteredColumn,
  Input,
  Loader,
  ResponsiveDecoration,
} from "../components"
import { useWallet } from "../helpers/wallet"
import { getCampaigns } from "../services/campaigns"

const CampaignsPageWrapper: FC<PropsWithChildren<{}>> = ({ children }) => (
  <>
    <ResponsiveDecoration
      name="campaigns_orange_blur.png"
      width={406}
      height={626}
      className="top-0 right-0 opacity-70"
    />

    <CenteredColumn className="pt-5">
      <h1 className="font-semibold text-4xl">All Campaigns</h1>

      {children}
    </CenteredColumn>
  </>
)

let latestFilter = 0

let firstCampaigns: Campaign[] = []

const Campaigns: NextPage = () => {
  const { setWallet } = useWallet()
  const [loading, setLoading] = useState(true)
  const [loadedCampaigns, setLoadedCampaigns] = useState(firstCampaigns)
  const [filteredCampaigns, setFilteredCampaigns] = useState(firstCampaigns)
  const [search, setSearch] = useState("")

  // Fetch campaigns.
  useEffect(() => {
    setLoading(true)
    getCampaigns(setWallet)
      .then((campaigns) => {
        firstCampaigns = campaigns
        setLoadedCampaigns(campaigns)
      })
      .catch((err) => {
        console.error(err)
        // TODO: Display error message.
      })
      .finally(() => setLoading(false))
  }, [setLoading, setWallet, setLoadedCampaigns])

  // Filter data for search.
  useEffect(() => {
    let currFilter = ++latestFilter
    if (!search?.trim()) setFilteredCampaigns(loadedCampaigns)
    else
      fuzzysort
        .goAsync(search, loadedCampaigns, {
          keys: ["name", "description"],
          allowTypo: true,
        })
        .then((results) => {
          // if another filter is running, don't update
          if (currFilter !== latestFilter) return
          setFilteredCampaigns(results.map(({ obj }) => obj))
        })
  }, [loadedCampaigns, search, setFilteredCampaigns])

  // If campaigns are loading, display loader.
  if (loading)
    return (
      <CampaignsPageWrapper>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader />
        </div>
      </CampaignsPageWrapper>
    )

  return (
    <CampaignsPageWrapper>
      <Input
        containerClassName="mt-4 mb-6"
        className="w-full"
        type="text"
        placeholder="Search all campaigns..."
        value={search}
        onChange={({ target: { value } }) => setSearch(value)}
      />

      {filteredCampaigns.length === 0 && (
        <p className="text-orange">No campaigns found.</p>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {filteredCampaigns.map((campaign) => (
          <AllCampaignsCard key={campaign.address} campaign={campaign} />
        ))}
      </div>
    </CampaignsPageWrapper>
  )
}

export default Campaigns
