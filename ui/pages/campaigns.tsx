import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useRecoilValue } from "recoil"

import {
  AllCampaignsCard,
  Button,
  CampaignsListPagination,
  CenteredColumn,
  Input,
  ResponsiveDecoration,
  Select,
  Suspense,
} from "@/components"
import { addFilter, filterExists, removeFilter } from "@/helpers"
import { featuredCampaigns, filteredCampaigns } from "@/state"
import { Status } from "@/types"

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

    if (typeof query?.f === "string") {
      setShowFeatured(query.f === "1")
    }
  }, [query, isReady, setFilter, setActiveFilter, setPage, setShowFeatured])

  // Save data to query.
  useEffect(() => {
    // Only save data once ready and when the data changes.
    if (
      !isReady ||
      (query.q === encodeURIComponent(filter) &&
        query.p === page.toString() &&
        query.f === (showFeatured ? "1" : "0"))
    )
      return

    routerPush(
      {
        pathname: "/campaigns",
        query: {
          q: encodeURIComponent(filter),
          p: page,
          f: showFeatured ? "1" : "0",
        },
      },
      undefined,
      { shallow: true }
    )
  }, [query, page, isReady, filter, routerPush, showFeatured])

  // Debounce filter input: wait until filter stops changing before refiltering campaigns.
  useEffect(() => {
    const timer = setTimeout(() => setActiveFilter(filter.trim()), 350)
    return () => clearTimeout(timer)
  }, [filter, setActiveFilter])

  // Scroll to top of page on page change.
  useEffect(() => {
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: "smooth",
    })
  }, [page])

  return (
    <>
      <Head>
        <title>DAO Up! | Campaigns</title>
      </Head>

      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="pt-5 pb-10 max-w-7xl">
        <h1 className="font-semibold text-2xl sm:text-3xl lg:text-4xl mb-8">
          {showFeatured ? "Featured" : "All"} Campaigns
        </h1>

        {!showFeatured && (
          <>
            <div className="flex flex-wrap flex-row justify-start items-center -mt-4">
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
            toggleFeatured={toggleFeatured}
          />
        </Suspense>
      </CenteredColumn>
    </>
  )
}

interface CampaignsContentProps {
  filter: string
  page: number
  setPage: Dispatch<SetStateAction<number>>
  showFeatured: boolean
  toggleFeatured: () => void
}

const CampaignsContent: FunctionComponent<CampaignsContentProps> = ({
  filter,
  page,
  setPage,
  showFeatured,
  toggleFeatured,
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
  } = useRecoilValue(featuredCampaigns)

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
    <div className="flex flex-col">
      {showingCampaigns?.length === 0 && (
        <p className="text-orange">No campaigns found.</p>
      )}
      {!!showingError && <p className="text-orange">{showingError}</p>}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {showingCampaigns?.map((campaign) => (
          <AllCampaignsCard key={campaign.address} campaign={campaign} />
        ))}
      </div>

      {(canGoBack || canGoForward) && !!showingCampaigns && (
        <CampaignsListPagination
          className="my-6"
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          goBack={goBack}
          goForward={goForward}
        />
      )}

      <Button
        bare
        className="underline !opacity-100 hover:no-underline self-end mt-10"
        onClick={toggleFeatured}
      >
        See {showFeatured ? "all" : "featured"} campaigns
      </Button>
    </div>
  )
}

export default Campaigns
