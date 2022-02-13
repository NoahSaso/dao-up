import cn from "classnames"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useRecoilValue } from "recoil"

import {
  AllCampaignsCard,
  Button,
  CenteredColumn,
  Input,
  ResponsiveDecoration,
  Select,
  Suspense,
} from "../components"
import { addFilter, filterExists, removeFilter } from "../helpers/filter"
import { featuredCampaigns, filteredCampaigns } from "../state/campaigns"
import { Status } from "../types"

interface CampaignsListProps {
  campaigns: Campaign[]
}
const CampaignsList: FC<CampaignsListProps> = ({ campaigns }) => (
  <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
    {campaigns.map((campaign) => (
      <AllCampaignsCard key={campaign.address} campaign={campaign} />
    ))}
  </div>
)

const minPage = 1
const pageSize = 20

let alreadyLoadedFromQuery = false

const Campaigns: NextPage = () => {
  const { query, isReady, push: routerPush } = useRouter()
  const [filter, setFilter] = useState("")
  const [activeFilter, setActiveFilter] = useState("")

  const [page, setPage] = useState(1)

  // Load data from query.
  useEffect(() => {
    if (alreadyLoadedFromQuery || !isReady) return
    // Only load once.
    alreadyLoadedFromQuery = true

    if (typeof query?.q === "string") {
      const decoded = decodeURIComponent(query.q)
      setFilter(decoded)
      setActiveFilter(decoded)
    }

    if (typeof query?.p === "string") {
      let loadedPage = Number(query.p) || minPage
      if (loadedPage < minPage) loadedPage = minPage
      setPage(loadedPage)
    }
  }, [query, isReady, setFilter, setActiveFilter, setPage])

  // Save data to query.
  useEffect(() => {
    // Only save data once ready and when the data changes.
    if (
      !isReady ||
      (query.q === encodeURIComponent(filter) && query.p === page.toString())
    )
      return

    routerPush(
      {
        pathname: "/campaigns",
        query: {
          q: encodeURIComponent(filter),
          p: page,
        },
      },
      undefined,
      { shallow: true }
    )
  }, [query, page, isReady, filter, routerPush])

  // Debounce filter input: wait until filter stops changing before refiltering campaigns.
  useEffect(() => {
    const timer = setTimeout(() => setActiveFilter(filter.trim()), 350)
    return () => clearTimeout(timer)
  }, [filter, setActiveFilter])

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-5 pb-10 max-w-7xl">
        <div className="mb-16">
          <h1 className="font-semibold text-3xl mb-6">Featured Campaigns</h1>

          <Suspense>
            <FeaturedCampaignsContent />
          </Suspense>
        </div>

        <div className="flex flex-col justify-start items-start sm:flex-row sm:items-center">
          <h1 className="font-semibold text-3xl">All Campaigns</h1>

          <div className="flex flex-wrap flex-row justify-start items-center ml-0 mt-4 sm:ml-10 sm:mt-0">
            <Select
              className="w-40"
              label="Status"
              items={Object.entries(Status).map(([label, value]) => ({
                label,
                onClick: (on) =>
                  on
                    ? setFilter((filter) => addFilter(filter, "status", value))
                    : setFilter((filter) =>
                        removeFilter(filter, "status", value)
                      ),
                selected: filterExists(filter, "status", value),
              }))}
            />
          </div>
        </div>

        <Input
          containerClassName="mt-4 mb-6"
          className="w-full"
          type="text"
          placeholder="Search all campaigns..."
          value={filter}
          onChange={({ target: { value } }) => setFilter(value)}
        />

        <Suspense>
          <CampaignsContent
            filter={activeFilter}
            page={page}
            setPage={setPage}
          />
        </Suspense>
      </CenteredColumn>
    </>
  )
}

const FeaturedCampaignsContent: FC = () => {
  const featured = useRecoilValue(featuredCampaigns)
  return featured.length ? (
    <CampaignsList campaigns={featured} />
  ) : (
    <p className="text-orange">No featured campaigns.</p>
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
  page: number
  setPage: Dispatch<SetStateAction<number>>
}

const CampaignsContent: FC<CampaignsContentProps> = ({
  filter,
  page,
  setPage,
}) => {
  const goBack = useCallback(
    () => setPage((p) => Math.max(minPage, p - 1)),
    [setPage]
  )
  const goForward = useCallback(() => setPage((p) => p + 1), [setPage])

  // Pagination state
  const canGoBack = page > minPage

  const {
    campaigns,
    hasMore: canGoForward,
    error,
  } = useRecoilValue(filteredCampaigns({ filter, page, size: pageSize }))

  // If loads no campaigns and not on first page, go back to first page.
  useEffect(() => {
    // Ensure campaigns are non null but empty, so we know it did not error.
    if (campaigns?.length === 0 && page !== minPage) setPage(minPage)
  }, [campaigns, page, setPage])

  return (
    <>
      {(canGoBack || canGoForward) && !!campaigns && (
        <Pagination
          className="-mt-2 mb-6"
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          goBack={goBack}
          goForward={goForward}
        />
      )}

      {campaigns?.length === 0 && (
        <p className="text-orange">No campaigns found.</p>
      )}
      {!!error && <p className="text-orange">{error}</p>}

      <CampaignsList campaigns={campaigns ?? []} />

      {(canGoBack || canGoForward) && !campaigns && (
        <Pagination
          className="my-6"
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          goBack={goBack}
          goForward={goForward}
        />
      )}
    </>
  )
}

export default Campaigns
