import type { NextPage } from "next"
import { FC, useEffect, useState } from "react"
import { useRecoilValueLoadable } from "recoil"

import {
  AllCampaignsCard,
  Button,
  CenteredColumn,
  Input,
  Loader,
  ResponsiveDecoration,
  Suspense,
} from "../components"
import { useCampaigns } from "../hooks/useCampaigns"
import { escrowContractAddressesCount } from "../state/campaigns"

const minPage = 1
const pageSize = 20

const Campaigns: NextPage = () => {
  const [filter, setFilter] = useState("")

  const [page, setPage] = useState(() => {
    // Load page number from hash.
    let pageFromHash = Number(window.location.hash.slice(1)) || minPage
    if (pageFromHash < minPage) pageFromHash = minPage
    return pageFromHash
  })

  // Use campaign count to determine which page buttons to show.
  const totalCampaigns = useRecoilValueLoadable(escrowContractAddressesCount)
  // Pagination state
  const maxPage =
    (totalCampaigns.state === "hasValue" &&
      Math.ceil(totalCampaigns.contents / pageSize)) ||
    minPage
  const canGoBack = page > minPage
  const canGoForward = page < maxPage

  // Update hash with page number.
  useEffect(() => {
    if (page < minPage) setPage(minPage)
    else if (page > maxPage) setPage(maxPage)
    else if (typeof page === "number") window.location.hash = "#" + page
  }, [page, maxPage, setPage])

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-5 pb-10">
        <h1 className="font-semibold text-4xl">All Campaigns</h1>
        <Input
          containerClassName="mt-4 mb-6"
          className="w-full"
          type="text"
          placeholder="Search all campaigns..."
          value={filter}
          onChange={({ target: { value } }) => setFilter(value)}
        />
        {totalCampaigns.state === "hasValue" && totalCampaigns.contents > 0 && (
          <div className="flex flex-row justify-between items-center -mt-4 mb-6">
            <Button
              onClick={() => setPage((p) => Math.max(minPage, p - 1))}
              disabled={!canGoBack}
            >
              Back
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={!canGoForward}
            >
              Next
            </Button>
          </div>
        )}

        <Suspense>
          <CampaignsContent filter={filter.trim()} page={page} />
        </Suspense>
      </CenteredColumn>
    </>
  )
}

interface CampaignsContentProps {
  filter: string
  page: number
}

const CampaignsContent: FC<CampaignsContentProps> = ({ filter, page }) => {
  const { filtering, campaigns, error } = useCampaigns({
    filter,
    page,
    size: pageSize,
  })

  // Show loader if actively filtering data.
  if (filtering) return <Loader />

  return (
    <>
      {campaigns.length === 0 && (
        <p className="text-orange">No campaigns found.</p>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <AllCampaignsCard key={campaign.address} campaign={campaign} />
        ))}
      </div>
    </>
  )
}

export default Campaigns
