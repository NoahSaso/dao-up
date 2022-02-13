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
import { IoStar, IoStarOutline } from "react-icons/io5"
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
import { Color, Status } from "../types"

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

  const [page, setPage] = useState(minPage)

  const [showFeatured, setShowFeatured] = useState(true)
  const toggleFeatured = () => {
    setShowFeatured((f) => !f)
    // Reset back to first page.
    setPage(minPage)
  }

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
        <div className="flex flex-row justify-between items-start mb-8">
          <h1 className="font-semibold text-4xl">
            {showFeatured ? "Featured" : "All"} Campaigns
          </h1>

          <Button outline color={Color.Light} onClick={toggleFeatured}>
            <div className="flex items-center gap-2">
              {showFeatured ? <IoStar /> : <IoStarOutline />}
              Featured
            </div>
          </Button>
        </div>

        {!showFeatured && (
          <>
            <div className="flex flex-wrap flex-row justify-start items-center mt-4">
              <Select
                className="w-40"
                label="Status"
                items={Object.entries(Status).map(([label, value]) => ({
                  label,
                  onClick: (on) =>
                    on
                      ? setFilter((filter) =>
                          addFilter(filter, "status", value)
                        )
                      : setFilter((filter) =>
                          removeFilter(filter, "status", value)
                        ),
                  selected: filterExists(filter, "status", value),
                }))}
              />
            </div>

            <Input
              containerClassName="mt-4 mb-6"
              className="w-full"
              type="text"
              placeholder="Search all campaigns..."
              value={filter}
              onChange={({ target: { value } }) => setFilter(value)}
            />
          </>
        )}

        <Suspense>
          <CampaignsContent
            filter={activeFilter}
            page={page}
            setPage={setPage}
            showFeatured={showFeatured}
          />
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
  page: number
  setPage: Dispatch<SetStateAction<number>>
  showFeatured: boolean
}

const CampaignsContent: FC<CampaignsContentProps> = ({
  filter,
  page,
  setPage,
  showFeatured,
}) => {
  const goBack = useCallback(
    () => setPage((p) => Math.max(minPage, p - 1)),
    [setPage]
  )
  const goForward = useCallback(() => setPage((p) => p + 1), [setPage])

  const {
    campaigns: allCampaigns,
    hasMore: hasMoreAll,
    error: allError,
  } = useRecoilValue(
    filteredCampaigns({
      filter,
      // Don't page if not showing all.
      page: showFeatured ? minPage : page,
      size: pageSize,
    })
  )

  const {
    campaigns: featured,
    hasMore: hasMoreFeatured,
    error: featuredError,
  } = useRecoilValue(
    featuredCampaigns({
      // Don't page if not showing featured.
      page: showFeatured ? page : minPage,
      size: pageSize,
    })
  )

  // Switch between which campaigns and associated metadata to use.
  const showingCampaigns = showFeatured ? featured : allCampaigns
  const showingHasMore = showFeatured ? hasMoreFeatured : hasMoreAll
  const showingError = showFeatured ? featuredError : allError

  // Pagination state
  const canGoBack = page > minPage
  const canGoForward = showingHasMore

  // If loads no campaigns and not on first page, go back to first page.
  useEffect(() => {
    // Ensure campaigns are non null but empty, so we know it did not error.
    if (showingCampaigns?.length === 0 && page !== minPage) setPage(minPage)
  }, [showingCampaigns, page, setPage])

  return (
    <>
      {(canGoBack || canGoForward) && !!showingCampaigns && (
        <Pagination
          className="-mt-2 mb-6"
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          goBack={goBack}
          goForward={goForward}
        />
      )}

      {showingCampaigns?.length === 0 && (
        <p className="text-orange">No campaigns found.</p>
      )}
      {!!showingError && <p className="text-orange">{showingError}</p>}

      <CampaignsList campaigns={showingCampaigns ?? []} />

      {(canGoBack || canGoForward) && !showingCampaigns && (
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
