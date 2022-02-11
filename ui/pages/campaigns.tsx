import cn from "classnames"
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
import { filteredCampaigns } from "../state/campaigns"

const minPage = 1
const pageSize = 2

const Campaigns: NextPage = () => {
  const [filter, setFilter] = useState("")
  const [currFilter, setCurrFilter] = useState("")

  // Debounce filter input: wait until filter stops changing before refiltering campaigns.
  useEffect(() => {
    const timer = setTimeout(() => setCurrFilter(filter.trim()), 350)
    return () => clearTimeout(timer)
  }, [filter, setCurrFilter])

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

        <Suspense>
          <CampaignsContent filter={currFilter} />
        </Suspense>
      </CenteredColumn>
    </>
  )
}

interface PaginationProps {
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
  className?: string
}
const Pagination: FC<PaginationProps> = ({
  canGoBack,
  canGoForward,
  goBack,
  goForward,
  className,
}) => (
  <div className={cn("flex flex-row justify-between items-center", className)}>
    <Button onClick={goBack} disabled={!canGoBack}>
      Back
    </Button>
    <Button onClick={goForward} disabled={!canGoForward}>
      Next
    </Button>
  </div>
)

interface CampaignsContentProps {
  filter: string
}

const CampaignsContent: FC<CampaignsContentProps> = ({ filter }) => {
  const [page, setPage] = useState(() => {
    // Load page number from hash.
    let pageFromHash = Number(window.location.hash.slice(1)) || minPage
    if (pageFromHash < minPage) pageFromHash = minPage
    return pageFromHash
  })

  const { state, contents } = useRecoilValueLoadable(
    filteredCampaigns({ filter, page, size: pageSize })
  )
  const filtering = state === "loading"
  const { campaigns, hasMore, error } = (contents ?? {
    campaigns: [],
    hasMore: false,
    error: null,
  }) as CampaignsResponse

  // Pagination state
  const canGoBack = page > minPage

  // Update hash with page number.
  useEffect(() => {
    if (page < minPage) setPage(minPage)
    else if (typeof page === "number") window.location.hash = "#" + page
  }, [page, setPage])

  // If loads no campaigns and not on first page, go back to first page.
  useEffect(() => {
    if (state === "hasValue" && page !== minPage && campaigns?.length === 0)
      setPage(minPage)
  }, [state, campaigns, page, setPage])

  // Show loader if actively filtering data.
  if (filtering) return <Loader />

  return (
    <>
      <Pagination
        className="-mt-2 mb-6"
        canGoBack={canGoBack}
        canGoForward={hasMore}
        goBack={() => setPage((p) => Math.max(minPage, p - 1))}
        goForward={() => setPage((p) => p + 1)}
      />

      {campaigns?.length === 0 && (
        <p className="text-orange">No campaigns found.</p>
      )}
      {!!error && <p className="text-orange">{error}</p>}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {campaigns?.map((campaign) => (
          <AllCampaignsCard key={campaign.address} campaign={campaign} />
        ))}
      </div>

      <Pagination
        className="my-6"
        canGoBack={canGoBack}
        canGoForward={hasMore}
        goBack={() => setPage((p) => Math.max(minPage, p - 1))}
        goForward={() => setPage((p) => p + 1)}
      />
    </>
  )
}

export default Campaigns
