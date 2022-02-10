import fuzzysort from "fuzzysort"
import { useEffect, useState } from "react"
import { useRecoilValue, waitForAll } from "recoil"

import { campaignsFromResponses } from "../services/campaigns"
import { escrowContractAddresses, fetchCampaign } from "../state/campaigns"

enum Filter {
  Status = "status",
}
type FilterType = `${Filter}`

type FilterFunction = (campaign: Campaign) => boolean
const filterFnMakers: Record<FilterType, (value: string) => FilterFunction> = {
  status: (value) => (c) => c.status === value,
}
const filterKeys = Object.keys(filterFnMakers)
// Matches `key{whitespace}:{whitespace}value` or `key{whitespace}:{whitespace}"value"`
const filterRegex = new RegExp(
  `(${filterKeys.join("|")})\\s*:\\s*([^\\s]+|"[^"]+")`,
  "gi"
)

let campaignsFilterId = 0
export const useCampaigns = (
  filter?: string,
  includeHidden = false,
  includePending = true
) => {
  const { addresses, error: escrowContractAddressesError } = useRecoilValue(
    escrowContractAddresses
  )

  const campaignResponses = useRecoilValue(
    waitForAll(addresses.map((address) => fetchCampaign(address)))
  )

  const [campaigns, setCampaigns] = useState(
    campaignsFromResponses(campaignResponses, includeHidden, includePending)
  )
  const [filtering, setFiltering] = useState(false)
  const [filterError, setFilterError] = useState(null as string | null)

  useEffect(() => {
    const updateCampaigns = async () => {
      setFiltering(true)
      setFilterError(null)

      let relevantCampaigns = campaignsFromResponses(
        campaignResponses,
        includeHidden,
        includePending
      )

      if (!filter) {
        setFiltering(false)
        return setCampaigns(relevantCampaigns)
      }

      // Extract filter keys from filter string.
      const filterKeyMatches = filter.match(filterRegex) ?? []
      const activeFilterFns: FilterFunction[] = []
      let search = filter
      for (const match of filterKeyMatches) {
        const key = match.split(":")[0].trim()
        const value = match
          .split(":")
          .slice(1)
          .join(":")
          .trim()
          // Remove quotes from ends of value if present.
          .replace(/^"/, "")
          .replace(/"$/, "")
          .trim()

        if (!(key in filterFnMakers)) continue

        // Make filter function and add to active filters.
        const filterFn = filterFnMakers[key as FilterType]
        activeFilterFns.push(filterFn(value))

        // Remove filter key/value from search string.
        search = search.replace(match, "").trim()
      }

      // Filter if any filters are active.
      if (activeFilterFns.length)
        relevantCampaigns = relevantCampaigns.filter((c) =>
          activeFilterFns.every((fn) => fn(c))
        )

      if (!search) {
        setFiltering(false)
        return setCampaigns(relevantCampaigns)
      }

      try {
        let id = ++campaignsFilterId

        const filtered = (
          await fuzzysort.goAsync(search, relevantCampaigns, {
            keys: ["name", "description"],
            allowTypo: true,
          })
        ).map(({ obj }) => obj)

        // If another filter has been kicked off, ignore this one.
        if (campaignsFilterId !== id) return

        setCampaigns(filtered)
      } catch (error) {
        console.error(error)
        // TODO: Display error.
        setFilterError(`${error}`)
      } finally {
        setFiltering(false)
      }
    }

    // Debounce filter input (wait 350ms before refiltering campaigns).
    const timer = setTimeout(() => updateCampaigns(), 350)
    return () => clearTimeout(timer)
  }, [
    campaignResponses,
    filter,
    setCampaigns,
    setFiltering,
    includeHidden,
    includePending,
  ])

  const firstError =
    escrowContractAddressesError ??
    filterError ??
    campaignResponses.find(({ error }) => !!error)?.error ??
    null

  return { filtering, campaigns, error: firstError }
}
